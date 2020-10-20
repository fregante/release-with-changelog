const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

const repoURL = process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY;

const excludePreset = /^meta|^document|^lint|^refactor|readme|dependencies|^\d\.\d\.\d/i;

async function generateReleaseNotes({
	range,
	exclude = '',
	commitTemplate = '- {hash} {title}',
	releaseTemplate = '{commits}\n\n{range}'
}) {
	// Get commits between computed range
	let {stdout: commits} = await execFile('git', ['log', '--format=%H%s', range]);
	commits = commits.split('\n').filter(Boolean).map(line => ({
		hash: line.slice(0, 8),
		title: line.slice(40)
	}));

	if (exclude) {
		// Booleans aren't currently supported: https://github.com/actions/toolkit/issues/361
		const regex = exclude === 'true' || exclude === true ? excludePreset : new RegExp(exclude);
		commits = commits.filter(({title}) => !regex.test(title));
	}

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

	return releaseTemplate
		.replace('{commits}', commitEntries.join('\n'))
		.replace('{range}', `[\`${range}\`](${repoURL}/compare/${range})`);
}

exports.generateReleaseNotes = generateReleaseNotes;
