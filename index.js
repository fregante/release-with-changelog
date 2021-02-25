const {getOctokit, context} = require('@actions/github');
const core = require('@actions/core');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

async function run() {
	try {
		const { owner, repo } = context.repo;
		const {stdout: changelogStdout } = await execFile('auto-changelog', ['--package', '--stdout', '--unreleased-only', '--hide-credit']);

		if (!changelogStdout) {
			core.info('There is nothing to be done here. Exiting!');
			return;
		}

		// Fetch tags from remote
		await execFile('git', ['fetch', 'origin', '+refs/tags/*:refs/tags/*']);

		// Get all tags, sorted by recently created tags
		const {stdout: t} = await execFile('git', ['tag', '-l', '--sort=-creatordate']);
		const tags = t.split('\n').filter(Boolean).map(tag => tag.trim());

		if (tags.length === 0) {
			core.info('There is nothing to be done here. Exiting!');
			return;
		}

		let pushedTag = core.getInput('tag') || tags[0];

		if (process.env.GITHUB_REF.startsWith('refs/tags/')) {
			pushedTag = process.env.GITHUB_REF.replace('refs/tags/', '');
			core.info('Using pushed tag as reference: ' + pushedTag);
		}

		// Create a release with markdown content in body
		const octokit = getOctokit(core.getInput('token'));
		const createReleaseResponse = await octokit.repos.createRelease({
			repo,
			owner,
			tag_name: pushedTag, // eslint-disable-line camelcase
			body: changelogStdout,
			draft: false,
			prerelease: false
		});

		core.info('Created release `' + createReleaseResponse.data.id + '` for tag `' + pushedTag + '`');
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
