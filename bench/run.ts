import { createHash } from "node:crypto";
import { allImplementations } from "../implementations/registry.ts";
import type { ByteInput, Implementation } from "../implementations/types.ts";

interface BenchCase {
  label: string;
  data: Buffer;
  encoded: string;
}

interface BenchSuite {
  id: string;
  label: string;
  sizes: number[];
}

interface Measurement {
  id: string;
  opsPerSecond: number;
}

const BENCH_TARGET_MS = 120;
const SAMPLE_COUNT = 3;
const SUITES: BenchSuite[] = [
  {
    id: "broad",
    label: "Broad Mix",
    sizes: [0, 1, 2, 4, 8, 16, 32, 64, 128, 256],
  },
  {
    id: "fixed32",
    sizes: [32],
  },
  {
    id: "fixed64",
    label: "64-Byte Hot Path",
    sizes: [64],
  },
  {
    id: "large",
    label: "Large Payloads",
    sizes: [128, 256, 512, 1024],
  },
];

interface BenchOptions {
  candidateFilter: Set<string> | null;
  suiteFilter: Set<string> | null;
}

function makeBytes(size: number, seed: number): Buffer {
  const bytes = Buffer.alloc(size);
  let state = seed | 0;

  for (let i = 0; i < size; i++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    bytes[i] = state & 0xff;
  }

  return bytes;
}

function benchmark(fn: () => void, targetMs = BENCH_TARGET_MS): number {
  fn();

  let iterations = 1;
  while (true) {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const elapsed = performance.now() - start;

    if (elapsed >= targetMs) {
      return (iterations / elapsed) * 1000;
    }

    const scaled = Math.ceil((iterations * targetMs) / Math.max(elapsed, 0.1));
    iterations = Math.max(iterations * 2, scaled);
  }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const midpoint = Math.floor(sorted.length / 2);
  return sorted[midpoint];
}

function geometricMean(values: number[]): number {
  const safe = values.filter((value) => value > 0);
  const sum = safe.reduce((acc, value) => acc + Math.log(value), 0);
  return Math.exp(sum / safe.length);
}

function checksum(buffers: ByteInput[]): string {
  const hash = createHash("sha256");
  for (const buffer of buffers) {
    hash.update(Buffer.from(buffer));
  }
  return hash.digest("hex").slice(0, 12);
}

function makeCases(reference: Implementation, sizes: number[], seedOffset = 0): BenchCase[] {
  return sizes.map((size, index) => {
    const data = makeBytes(size, 0x12345678 ^ (index * 0x9e3779b9));
    if (size >= 8 && (index + seedOffset) % 2 === 0) {
      data[0] = 0;
    }
    if (size >= 16 && (index + seedOffset) % 3 === 0) {
      data[1] = 0;
    }

    return {
      label: `${size}B`,
      data,
      encoded: reference.encode(data),
    };
  });
}

function ensureCorrectness(implementations: Implementation[], cases: BenchCase[]): void {
  for (const benchCase of cases) {
    const expectedEncoded = benchCase.encoded;
    const decodedSamples: ByteInput[] = [];

    for (const implementation of implementations) {
      const encoded = implementation.encode(benchCase.data);
      if (encoded !== expectedEncoded) {
        throw new Error(`${implementation.id} encode mismatch for ${benchCase.label}`);
      }

      const decoded = implementation.decode(benchCase.encoded);
      if (!decoded.equals(benchCase.data)) {
        throw new Error(`${implementation.id} decode mismatch for ${benchCase.label}`);
      }

      decodedSamples.push(decoded);
    }

    if (checksum(decodedSamples) === "") {
      throw new Error(`unexpected checksum failure for ${benchCase.label}`);
    }
  }
}

function measureEncode(implementations: Implementation[], benchCase: BenchCase): Measurement[] {
  return implementations
    .map((implementation) => {
      const samples = Array.from({ length: SAMPLE_COUNT }, () =>
        benchmark(() => {
          implementation.encode(benchCase.data);
        }),
      );

      return {
        id: implementation.id,
        opsPerSecond: median(samples),
      };
    })
    .sort((a, b) => b.opsPerSecond - a.opsPerSecond);
}

function measureDecode(implementations: Implementation[], benchCase: BenchCase): Measurement[] {
  return implementations
    .map((implementation) => {
      const samples = Array.from({ length: SAMPLE_COUNT }, () =>
        benchmark(() => {
          implementation.decode(benchCase.encoded);
        }),
      );

      return {
        id: implementation.id,
        opsPerSecond: median(samples),
      };
    })
    .sort((a, b) => b.opsPerSecond - a.opsPerSecond);
}

function printMeasurements(title: string, measurements: Measurement[]): void {
  console.log(title);
  measurements.forEach((measurement, index) => {
    console.log(
      `  ${index + 1}. ${measurement.id.padEnd(24)} ${Math.round(measurement.opsPerSecond).toLocaleString()}/s`,
    );
  });
}

function parseArgs(argv: string[]): BenchOptions {
  const options: BenchOptions = {
    candidateFilter: null,
    suiteFilter: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const value = argv[i + 1];

    if (arg === "--suite" && value) {
      options.suiteFilter = new Set(value.split(",").map((part) => part.trim()).filter(Boolean));
      i++;
      continue;
    }

    if (arg === "--only" && value) {
      options.candidateFilter = new Set(value.split(",").map((part) => part.trim()).filter(Boolean));
      i++;
    }
  }

  return options;
}

function summarizeOverall(
  cases: BenchCase[],
  implementations: Implementation[],
  scoreboard: Map<string, number[]>,
  label: "Encode" | "Decode",
): void {
  const overall = [...scoreboard.entries()]
    .map(([id, values]) => ({
      id,
      score: geometricMean(values),
    }))
    .sort((a, b) => b.score - a.score);

  console.log(`\nOverall ${label} Winner: ${overall[0]?.id ?? "n/a"}`);
  overall.forEach((entry, index) => {
    console.log(`  ${index + 1}. ${entry.id.padEnd(24)} ${Math.round(entry.score).toLocaleString()}/s gmean`);
  });

  console.log(`  Cases: ${cases.map((benchCase) => benchCase.label).join(", ")}`);

  const winnersByKind = new Map<string, { id: string; score: number }>();
  for (const entry of overall) {
    const implementation = implementations.find((candidate) => candidate.id === entry.id);
    if (!implementation) {
      continue;
    }

    const current = winnersByKind.get(implementation.kind);
    if (!current || entry.score > current.score) {
      winnersByKind.set(implementation.kind, entry);
    }
  }

  console.log(`  Best by family:`);
  for (const implementationKind of ["js", "native", "baseline"]) {
    const winner = winnersByKind.get(implementationKind);
    if (!winner) {
      continue;
    }

    console.log(
      `    ${implementationKind.padEnd(8)} ${winner.id.padEnd(24)} ${Math.round(winner.score).toLocaleString()}/s gmean`,
    );
  }
}

export async function runBenchmarks(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const implementations = allImplementations.filter((implementation) =>
    options.candidateFilter ? options.candidateFilter.has(implementation.id) : true,
  );
  const reference = allImplementations.find((implementation) => implementation.id === "baseline/bs58");

  if (!reference) {
    throw new Error("baseline/bs58 implementation is required");
  }

  console.log("=".repeat(72));
  console.log("Base58 implementation benchmark");
  console.log("Implementations are benchmarked separately for encode and decode across multiple suites.");
  console.log(`Validated implementations: ${implementations.map((implementation) => implementation.id).join(", ")}`);
  console.log("=".repeat(72));

  const suites = SUITES.filter((suite) => (options.suiteFilter ? options.suiteFilter.has(suite.id) : true));

  for (const [suiteIndex, suite] of suites.entries()) {
    const cases = makeCases(reference, suite.sizes, suiteIndex * 17);
    ensureCorrectness(implementations, cases);

    console.log(`\n${suite.label}`);
    console.log("-".repeat(72));

    const encodeScoreboard = new Map<string, number[]>();
    const decodeScoreboard = new Map<string, number[]>();

    for (const benchCase of cases) {
      console.log(`\n${benchCase.label}`);

      const encodeMeasurements = measureEncode(implementations, benchCase);
      printMeasurements("Encode", encodeMeasurements);
      for (const measurement of encodeMeasurements) {
        const current = encodeScoreboard.get(measurement.id) ?? [];
        current.push(measurement.opsPerSecond);
        encodeScoreboard.set(measurement.id, current);
      }

      const decodeMeasurements = measureDecode(implementations, benchCase);
      printMeasurements("Decode", decodeMeasurements);
      for (const measurement of decodeMeasurements) {
        const current = decodeScoreboard.get(measurement.id) ?? [];
        current.push(measurement.opsPerSecond);
        decodeScoreboard.set(measurement.id, current);
      }
    }

    console.log("\n" + "=".repeat(72));
    summarizeOverall(cases, implementations, encodeScoreboard, "Encode");
    summarizeOverall(cases, implementations, decodeScoreboard, "Decode");
    console.log("=".repeat(72));
  }
}
