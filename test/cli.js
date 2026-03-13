import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "child_process";
import { resolve } from "path";
import { writeFileSync, unlinkSync, readFileSync } from "fs";
import { tmpdir } from "os";

const CLI = resolve(import.meta.dirname, "../src/cli.js");

function run(args, opts = {}) {
  return execFileSync("node", [CLI, ...args], {
    encoding: "utf8",
    timeout: 10000,
    ...opts,
  });
}

// ─── --help flag ─────────────────────────────────────────────────────────────

test("cli: --help exits with code 0", () => {
  const out = run(["--help"]);
  assert.ok(out.includes("mdcat"), "help output should mention mdcat");
});

test("cli: -h is alias for --help", () => {
  const out = run(["-h"]);
  assert.ok(out.includes("mdcat"));
});

test("cli: --help shows usage section", () => {
  const out = run(["--help"]);
  assert.ok(out.includes("Usage"), "help should show Usage section");
});

test("cli: --help shows key bindings", () => {
  const out = run(["--help"]);
  assert.ok(out.includes("Keys"), "help should show Keys section");
});

test("cli: --help mentions --web flag", () => {
  const out = run(["--help"]);
  assert.ok(out.includes("--web"), "help should mention --web");
});

test("cli: --help mentions --doc flag", () => {
  const out = run(["--help"]);
  assert.ok(out.includes("--doc"), "help should mention --doc");
});

// ─── --version flag ──────────────────────────────────────────────────────────

test("cli: --version exits with code 0", () => {
  const out = run(["--version"]);
  assert.ok(out.includes("mdcat"), "version output should mention mdcat");
});

test("cli: -v is alias for --version", () => {
  const out = run(["-v"]);
  assert.ok(out.includes("mdcat"));
});

test("cli: --version shows version number", () => {
  const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"));
  const out = run(["--version"]);
  assert.ok(out.includes(pkg.version), `version output should contain ${pkg.version}`);
});

// ─── Missing file ────────────────────────────────────────────────────────────

test("cli: non-existent file prints error and exits non-zero", () => {
  try {
    run(["nonexistent-file-xyz.md"], { stdio: "pipe" });
    assert.fail("should have thrown");
  } catch (err) {
    assert.ok(err.stderr.includes("No such file") || err.status !== 0);
  }
});

// ─── No arguments ────────────────────────────────────────────────────────────

test("cli: no arguments exits non-zero", () => {
  try {
    execFileSync("node", [CLI], { encoding: "utf8", timeout: 10000, stdio: "pipe" });
    assert.fail("should have thrown");
  } catch (err) {
    assert.ok(err.status !== 0, "should exit with non-zero status");
  }
});

// ─── --doc flag ──────────────────────────────────────────────────────────────

test("cli: --doc produces a .docx file", () => {
  const name = `mdcat-test-${Date.now()}`;
  const tmpMd = `${tmpdir()}/${name}.md`;
  // --doc writes <basename-without-.md>.docx to cwd
  const expectedDocx = resolve(`${name}.docx`);
  writeFileSync(tmpMd, "# Test\n\nHello world.");
  try {
    run(["--doc", tmpMd]);
    const buf = readFileSync(expectedDocx);
    assert.ok(buf.length > 0, "docx file should not be empty");
    assert.equal(buf[0], 0x50, "docx should start with P");
    assert.equal(buf[1], 0x4b, "docx should start with K");
  } finally {
    try { unlinkSync(tmpMd); } catch {}
    try { unlinkSync(expectedDocx); } catch {}
  }
});

test("cli: -d is alias for --doc", () => {
  const name = `mdcat-test2-${Date.now()}`;
  const tmpMd = `${tmpdir()}/${name}.md`;
  const expectedDocx = resolve(`${name}.docx`);
  writeFileSync(tmpMd, "# Test");
  try {
    run(["-d", tmpMd]);
    const buf = readFileSync(expectedDocx);
    assert.ok(buf.length > 0);
  } finally {
    try { unlinkSync(tmpMd); } catch {}
    try { unlinkSync(expectedDocx); } catch {}
  }
});

// ─── Piped input ─────────────────────────────────────────────────────────────

test("cli: --doc with piped input produces .docx", () => {
  const expectedDocx = resolve("stdin.docx");
  try {
    execFileSync("node", [CLI, "--doc"], {
      input: "# Piped\n\nHello from stdin.",
      encoding: "utf8",
      timeout: 10000,
    });
    const buf = readFileSync(expectedDocx);
    assert.ok(buf.length > 0);
  } finally {
    try { unlinkSync(expectedDocx); } catch {}
  }
});
