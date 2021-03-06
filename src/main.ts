import * as core from '@actions/core'
import * as fs from 'fs'
import commit from './commit'
import { createTag } from './createTag'
import { bump, capitalize, replacePattern, LineReplaced } from './support'
import { createAnnotations } from './createAnnotation'

const versionRegex = /[0-9]+\.[0-9]+\.[0-9]+/

async function run() {
    console.log('running')
    const githubToken =
        core.getInput('github_token') || process.env.GITHUB_TOKEN
    const branch = core.getInput('branch') || process.env.BRANCH || 'master' // TODO get current branch from actions
    const versionPath = core.getInput('version_file') || 'VERSION'
    const prefix = (core.getInput('prefix') || '').trim()
    const version = fs
        .readFileSync(versionPath, 'utf8')
        .toString()
        .trim()
    const newVersion = bump(version)
    console.log('wrinting new version file')
    fs.writeFileSync(versionPath, newVersion, 'utf8')
    let linesReplaced: LineReplaced[] = []
    if (prefix) {
        console.log(`replacing version patterns below [bump if ${prefix}]`)
        const pattern = new RegExp('\\[bump if ' + prefix + '\\]')
        const res = await replacePattern(pattern, versionRegex, newVersion)
        linesReplaced = res.linesReplaced
    } else {
        console.log(`replacing version patterns below [bump]`)
        const res = await replacePattern(/\[bump\]/, versionRegex, newVersion)
        linesReplaced = res.linesReplaced
    }
    const tagName = prefix ? prefix + '_' + newVersion : newVersion
    const tagMsg = `${capitalize(prefix) + ' '}Version ${newVersion} [skip ci]`
    await Promise.all([
        commit({
            USER_EMAIL: 'bump@version.com',
            USER_NAME: 'bump-version',
            GITHUB_TOKEN: githubToken,
            MESSAGE: tagMsg,
            tagName,
            tagMsg,
            branch,
        }),
        createTag({
            tagName,
            tagMsg,
        }),
    ])
    console.log('setting output version=' + newVersion + ' prefix=' + prefix)
    await createAnnotations({ githubToken, newVersion: tagMsg, linesReplaced })
    core.setOutput('version', newVersion)
    core.setOutput('prefix', prefix)
    core.info(`new version ${tagMsg}`)
}

try {
    run()
} catch (e) {
    console.error(e)
}
