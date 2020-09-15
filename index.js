const {getOctokit, context} = require('@actions/github');
const core = require('@actions/core');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

async function run() {
	try {
		const {owner, repo} = context.repo;

		const repoURL = process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY;

		const releaseTemplate = core.getInput('template');
		const commitTemplate = core.getInput('commit-template');
		const exclude = core.getInput('exclude');

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

		// Get range to generate diff
		let range = tags[1] + '..' + pushedTag;
		if (tags.length < 2) {
			const {stdout: rootCommit} = await execFile('git', ['rev-list', '--max-parents=0', 'HEAD']);
			range = rootCommit.trim('') + '..' + pushedTag;
		}

		core.info('Computed range: ' + range);

		// Get commits between computed range
		let {stdout: commits} = await execFile('git', ['log', '--format=%H%s', range]);
		commits = commits.split('\n').filter(Boolean).map(line => ({
			hash: line.slice(0, 8),
			title: line.slice(40)
		}));

		if (exclude) {
			const regex = new RegExp(exclude);
			commits = commits.filter(({title}) => !regex.test(title));
		}

		// Generate markdown content
		const commitEntries = [];
		if (commits.length === 0) {
			commitEntries.push('_Maintenance release_');
		} else {
			for (const {hash, title} of commits) {
				const line = commitTemplate
					.replace('{hash}', hash)
					.replace('{title}', title)
					.replace('{url}', repoURL + '/commit/' + hash);
				commitEntries.push(line);
			}
		}

		const octokit = getOctokit(core.getInput('token'));
		const createReleaseResponse = await octokit.repos.createRelease({
			repo,
			owner,
			tag_name: pushedTag, // eslint-disable-line camelcase
			body: releaseTemplate
				.replace('{commits}', commitEntries.join('\n'))
				.replace('{range}', `[\`${range}\`](${repoURL}/compare/${range})`),
			draft: false,
			prerelease: false
		});

		core.info('Created release `' + createReleaseResponse.data.id + '` for tag `' + pushedTag + '`');
	} catch (error) {
		core.setFailed(error.message);
	}
}

run();
