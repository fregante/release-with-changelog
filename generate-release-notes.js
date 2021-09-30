const util = require('util');
const execFile = util.promisify(require('child_process').execFile);

const repoURL = process.env.GITHUB_SERVER_URL + '/' + process.env.GITHUB_REPOSITORY;

const excludePreset = /^bump |^meta|^document|^lint|^refactor|readme|dependencies|^v?\d+\.\d+\.\d+/i;

async function generateReleaseNotes({
	range,
	exclude = '',
	commitTemplate = '- {hash} {title}',
	releaseTemplate = '{commits}\n\n{range}',
	dateFormat = 'short',
	sort = 'desc',
	skipOnEmpty = false
}) {
	dateFormat = dateFormat.includes('%') ? 'format:' + dateFormat : dateFormat;
	// Get commits between computed range
	let {stdout: commits} = await execFile('git', [
		'log',
		'--format=%H¬%ad¬%s',
		'--date=' + dateFormat,
		sort === 'asc' && '--reverse',
		range
	].filter(Boolean));
	commits = commits.split('\n').filter(Boolean).map(line => {
		const [hash, date, title] = line.split('¬');
		return {
			hash: hash.slice(0, 8),
			date,
			title
		};
	});

	if (exclude) {
		// Booleans aren't currently supported: https://github.com/actions/toolkit/issues/361
		const regex = exclude === 'true' || exclude === true ? excludePreset : new RegExp(exclude);
		commits = commits.filter(({title}) => !regex.test(title));
	}

	const commitEntries = [];
	if (commits.length === 0) {
		if (skipOnEmpty) {
			return null;
		}

		commitEntries.push('_Maintenance release_');
	} else {
		for (const {hash, date, title} of commits) {
			const line = commitTemplate
				.replace('{hash}', hash)
				.replace('{url}', repoURL + '/commit/' + hash)
				.replace('{date}', date)
				.replace('{title}', title);
			commitEntries.push(line);
		}
	}

	return releaseTemplate
		.replace('{commits}', commitEntries.join('\n'))
		.replace('{range}', `[\`${range}\`](${repoURL}/compare/${range})`);
}

exports.generateReleaseNotes = generateReleaseNotes;
