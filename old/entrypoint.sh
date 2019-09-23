#!/bin/sh

set -e

echo starting

# only_on_commit
# VERSION_FILE
# github_token
# prefix

([ -z "$GITHUB_ONLY_ON_COMMIT" ] || [ "$GITHUB_ONLY_ON_COMMIT" = "$GITHUB_COMMIT_MESSAGE" ]) || exit 0

[ -z "$INPUT_VERSION_FILE" ] && INPUT_VERSION_FILE=./VERSION
# [ \( -z "$REPOSITORY" \) -a \( ! -z "$CIRCLE_PROJECT_REPONAME" \) ] && REPOSITORY="$CIRCLE_PROJECT_USERNAME/$CIRCLE_PROJECT_REPONAME"
# [ -f $INPUT_VERSION_FILE ] || (echo "file containing current version is needed, default is ./VERSION, customizable with INPUT_VERSION_FILE env var" && exit 1)
# [ -z "$REPOSITORY" ] && (echo "env var REPOSITORY is needed when executing outside of circleci, (for exampe REPOSITORY=user/repo)" && exit 1)

git config user.email "bump@version.com"
git config user.name "bump-version"

# git checkout master
git pull --commit --no-edit https://${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git # master



# [ -z "$GIT_CHECK" ] || /suitable $GIT_CHECK && CONTINUE=1
# [ -n "$CONTINUE" ] || exit 0


(/script/bump --filename $INPUT_VERSION_FILE)
export VERSION=`cat $INPUT_VERSION_FILE`

[ -n "$INPUT_PREFIX" ] || (echo 'running _sed'; /_sed)
[ -z "$INPUT_PREFIX" ] || (echo 'running _sed_with_prefix'; /_sed_with_prefix)

git add -A 
git commit -m "${INPUT_PREFIX} ${VERSION}"  -m "[skip ci]"
[ -n "$INPUT_PREFIX" ] && (git tag -a "${INPUT_PREFIX}_${VERSION}" -m "[skip ci]") || (git tag -a "${VERSION}" -m "[skip ci]")

git show-ref
git push --follow-tags "https://${GITHUB_ACTOR}:${GITHUB_TOKEN}@github.com/${GITHUB_REPOSITORY}.git" HEAD:master