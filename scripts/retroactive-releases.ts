/**
 * Create (or refresh) GitHub Releases v0.1.0…v0.10.0 with vukem-style notes:
 * ### Added|Changed|Fixed|Security + `* **scope:** Subject (sha)`.
 *
 * Usage: bun run scripts/retroactive-releases.ts
 * Requires `gh` auth. Does not push binary-building tags except v0.10.0
 * (see .github/workflows/release.yml).
 */
import { $ } from "bun";

type Release = {
	tag: string;
	sha: string;
	/** Exclusive lower bound (previous tag or empty for first). */
	since: string | null;
};

const RELEASES: Release[] = [
	{ tag: "v0.1.0", sha: "f1ac40d", since: null },
	{ tag: "v0.2.0", sha: "bb54226", since: "v0.1.0" },
	{ tag: "v0.3.0", sha: "b3cb9a1", since: "v0.2.0" },
	{ tag: "v0.4.0", sha: "34eec35", since: "v0.3.0" },
	{ tag: "v0.5.0", sha: "724f0d9", since: "v0.4.0" },
	{ tag: "v0.6.0", sha: "689d81a", since: "v0.5.0" },
	{ tag: "v0.7.0", sha: "d05d55d", since: "v0.6.0" },
	{ tag: "v0.8.0", sha: "8c9c068", since: "v0.7.0" },
	{ tag: "v0.9.0", sha: "0f7285a", since: "v0.8.0" },
	{ tag: "v0.10.0", sha: "HEAD", since: "v0.9.0" },
];

const TYPE_SECTION: Record<string, "Added" | "Changed" | "Fixed" | "Security"> = {
	feat: "Added",
	fix: "Fixed",
	perf: "Changed",
	refactor: "Changed",
	docs: "Changed",
	style: "Changed",
	test: "Changed",
	build: "Changed",
	ci: "Changed",
	chore: "Changed",
	revert: "Fixed",
};

function parseSubject(raw: string): { type: string; scope: string; subject: string; breaking: boolean } | null {
	const m = raw.match(/^(\w+)(\(.+?\))?(!)?:\s*(.+)$/);
	if (!m) return null;
	const type = m[1].toLowerCase();
	if (type === "merge") return null;
	const scope = (m[2] ? m[2].slice(1, -1) : type === "feat" || type === "fix" ? "repo" : type).toLowerCase();
	// Never surface SemVer bump commits (chore(release): vX.Y.Z) in notes.
	if (type === "chore" && (/^v?\d+\.\d+\.\d+/i.test(m[4]) || scope === "release")) return null;
	return { type, scope, subject: m[4].trim().replace(/\.$/, ""), breaking: Boolean(m[3]) };
}

async function commitsBetween(since: string | null, until: string): Promise<Array<{ sha: string; subject: string }>> {
	const range = since ? `${since}..${until}` : until;
	const args = since ? ["log", "--format=%h\t%s", range] : ["log", "--format=%h\t%s", "-15", until];
	const out = await $`git ${args}`.text();
	return out
		.trim()
		.split("\n")
		.filter(Boolean)
		.map((line) => {
			const [sha, ...rest] = line.split("\t");
			return { sha, subject: rest.join("\t") };
		});
}

function buildNotes(commits: Array<{ sha: string; subject: string }>): string {
	const buckets: Record<"Added" | "Changed" | "Fixed" | "Security", string[]> = {
		Added: [],
		Changed: [],
		Fixed: [],
		Security: [],
	};

	for (const { sha, subject } of commits) {
		const parsed = parseSubject(subject);
		if (!parsed) continue;
		let section = TYPE_SECTION[parsed.type] ?? "Changed";
		if (parsed.type === "fix" && /security/i.test(parsed.scope)) section = "Security";
		if (parsed.breaking) {
			buckets[section].push(`* **BREAKING:** **${parsed.scope}:** ${parsed.subject} (${sha})`);
		} else {
			buckets[section].push(`* **${parsed.scope}:** ${parsed.subject} (${sha})`);
		}
	}

	const parts: string[] = [];
	for (const name of ["Added", "Changed", "Fixed", "Security"] as const) {
		if (buckets[name].length === 0) continue;
		parts.push(`### ${name}`, "", ...buckets[name], "");
	}
	if (parts.length === 0) {
		return "### Changed\n\n* **repo:** Release checkpoint.\n";
	}
	return `${parts.join("\n").trimEnd()}\n`;
}

async function resolveSha(ref: string): Promise<string> {
	return (await $`git rev-parse ${ref}`.text()).trim();
}

async function releaseExists(tag: string): Promise<boolean> {
	const r = await $`gh release view ${tag}`.nothrow().quiet();
	return r.exitCode === 0;
}

async function main() {
	const head = await resolveSha("HEAD");
	for (const rel of RELEASES) {
		const sha = rel.sha === "HEAD" ? head : await resolveSha(rel.sha);
		const short = sha.slice(0, 7);
		const commits = await commitsBetween(rel.since, sha);
		const notes = buildNotes(commits);
		const notesFile = `.retro-notes-${rel.tag}.md`;
		await Bun.write(notesFile, notes);

		const exists = await releaseExists(rel.tag);
		if (exists) {
			console.log(`updating notes ${rel.tag} @ ${short}`);
			await $`gh release edit ${rel.tag} --title ${rel.tag} --notes-file ${notesFile}`;
		} else {
			console.log(`creating ${rel.tag} @ ${short}`);
			// Create annotated tag locally if missing, then release (creates tag on GH if needed).
			const tagExists =
				(await $`git rev-parse -q --verify refs/tags/${rel.tag}`.nothrow().quiet()).exitCode === 0;
			if (!tagExists) {
				await $`git tag -a ${rel.tag} ${sha} -m ${rel.tag}`;
			}
			await $`gh release create ${rel.tag} --target ${sha} --title ${rel.tag} --notes-file ${notesFile}`;
		}
		await $`rm -f ${notesFile}`;
	}
	console.log("done");
}

await main();
