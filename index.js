const {getOctokit, context} = require('@actions/github');
const core = require('@actions/core');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

async function run() {
	try {
		const {owner, repo} = context.repo;

		const header = core.getInput('header');
		const footer = core.getInput('footer');
		const includeHash = core.getInput('include-hash');
		const includeRange = core.getInput('include-range');

		// Get all tags sorted by recently created tags
		const {stdout: t} = await execFile('git', ['tag', '-l', '--sort=-creatordate']);
		const tags = t.split('\n').filter(Boolean).map(tag => tag.trim());
		core.info('List of tags found: ' + JSON.stringify(tags));

		if (tags.length === 0) {
			core.info('There is nothing to be done here. Exiting!');
			return;
		}

		let tag = core.getInput('tag') || tags[0];

		// Warn users of tags out of order / for pushing older tags
		if (process.env.GITHUB_REF.startsWith('refs/tags/')) {
			tag = process.env.GITHUB_REF.replace('refs/tags/', '');
			core.info('Using pushed tag as reference: ' + tag);
		}

		// Get range to generate diff
		let range = tags[1] + '..' + tag;
		if (tags.length < 2) {
			const {stdout: rootCommit} = await execFile('git', ['rev-list', '--max-parents=0', 'HEAD']);
			range = rootCommit.trim('') + '..' + tag;
		}

		core.info('Computed range: ' + range);

		// Get commits between computed range
		let {stdout: commits} = await execFile('git', ['log', '--format=%H%s', range]);
		commits = commits.split('\n').filter(Boolean);

		// Generate markdown content
		const releaseBody = [];

		if (header) {
			releaseBody.push(header + '\n');
		}

		if (commits.length === 0) {
			releaseBody.push('__There isn’t anything to compare__');
		} else {
			for (const commit of commits) {
				const hash = commit.slice(0, 40);
				if (includeHash) {
					releaseBody.push(`- [\`${hash.slice(0, 8)}\`](https://github.com/${owner}/${repo}/commits/${hash}) ${commit.slice(40)}`);
				} else {
					releaseBody.push('- ' + commit.slice(40));
				}
			}
		}

		if (footer) {
			releaseBody.push('\n' + footer);
		}

		if (includeRange) {
			releaseBody.push(`\n[\`${range}\`](https://github.com/${owner}/${repo}/compare/${range})`);
		}

		const octokit = getOctokit(core.getInput('token'));
		const createReleaseResponse = await octokit.repos.createRelease({
			repo,
			owner,
			tag_name: tag, // eslint-disable-line camelcase
			body: releaseBody.join('\n'),
			draft: false,
			prerelease: false
		});

		core.info('Created release `' + createReleaseResponse.data.id + '` for tag `' + tag + '`');
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
