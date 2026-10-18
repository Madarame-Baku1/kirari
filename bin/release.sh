#!/usr/bin/env bash

set -e  # Exit on any error

# Colors for output
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
BLUE=$'\033[0;34m'
NC=$'\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/verify-packed-manifest.sh"

# Publish order matters: the integrations peer on Kirari.
PACKAGE_DIRS=(packages/kirari packages/rehype packages/react)

print_status() {
    echo "${BLUE}🔄 $1...${NC}"
}

print_success() {
    echo "${GREEN}✅ $1${NC}"
}

print_error() {
    echo "${RED}❌ $1${NC}"
}

prompt_for_confirmation() {
    local message="$1"
    echo -n "$message (y/N): "
    read -r answer
    case "$answer" in
        [Yy]|[Yy][Ee][Ss]) return 0 ;;
        *) return 1 ;;
    esac
}

check_git_status() {
    local status
    status=$(git status --porcelain 2>/dev/null)

    if [ -n "$status" ]; then
        print_error "Working directory is not clean. Please commit or stash changes first."
        echo "Uncommitted changes:"
        echo "$status"
        exit 1
    fi
}

manifest_field() {
    node -e "console.log(require('./$1/package.json').$2)"
}

verify_published_package() {
    local package="$1" attempt output

    # Registry reads can lag a successful publish; retry reads, never the upload.
    for attempt in 1 2 3 4 5 6; do
        if output=$(npm view "$package" version --prefer-online --fetch-retries=0 --fetch-timeout=10000 2>&1); then
            return 0
        fi
        if [ "$attempt" -lt 6 ]; then
            print_status "Registry has not confirmed $package (attempt $attempt/6); retrying in 5s"
            sleep 5
        fi
    done

    printf '%s\n' "$output" >&2
    return 1
}

echo -e "${BLUE}🚀 Starting Kirari release...${NC}"
echo

print_status "Checking git status"
check_git_status

HAS_CHANGESETS=false
if find .changeset -maxdepth 1 -name '*.md' ! -name 'README.md' | grep -q .; then
    HAS_CHANGESETS=true
    print_status "Planning version updates"
    # Both packages are a fixed group, so they always share one version.
    CHANGESET_STATUS_DIR=$(mktemp -d)
    trap 'rm -rf "$CHANGESET_STATUS_DIR"' EXIT
    bunx changeset status --output="$CHANGESET_STATUS_DIR/status.json"
    node -e '
      const plan = JSON.parse(require("node:fs").readFileSync(process.argv[1], "utf8"));
      for (const release of plan.releases.filter(release => release.type !== "none")) {
        console.log(`  ${release.name}: ${release.oldVersion} → ${release.newVersion}`);
      }
    ' "$CHANGESET_STATUS_DIR/status.json"
    rm -rf "$CHANGESET_STATUS_DIR"
    trap - EXIT
else
    print_status "No pending changesets - publishing the current versions"
    for dir in "${PACKAGE_DIRS[@]}"; do
        echo "  $(manifest_field "$dir" name)@$(manifest_field "$dir" version)"
    done
fi

if ! prompt_for_confirmation "🔥 Apply this release plan and publish?"; then
    print_error "Release cancelled."
    exit 1
fi

echo

# Changesets v3 exits 1 when there is nothing to version, which under 'set -e'
# stops a resumed release (changesets already consumed and committed) before
# it can publish.
if [ "$HAS_CHANGESETS" = true ]; then
    bunx changeset version
fi

# Also refresh on retries: a prior lockfile update may have failed after versioning.
node "$SCRIPT_DIR/lib/sync-workspace-versions.mjs"
bun install --lockfile-only --ignore-scripts

# Typechecks, tests, builds, the docs site, and the packed-consumer install check.
bun run check

git add -A
# A resumed release (publish failed after versioning was committed) has nothing
# left to stage, and an empty commit would stop the retry under 'set -e'.
if git diff --cached --quiet; then
    print_status "No version changes to commit - resuming an in-progress release"
else
    git commit -m 'chore: release'
fi

git push

print_status "Checking npm authentication"
if ! npm whoami &>/dev/null; then
    print_status "Authenticating with npm (will open browser for passkey)"
    npm login --auth-type=web
else
    print_success "Already authenticated with npm"
fi

for dir in "${PACKAGE_DIRS[@]}"; do
    PACKAGE_NAME=$(manifest_field "$dir" name)
    PACKAGE_VERSION=$(manifest_field "$dir" version)

    # A resumed release may have published Kirari before Rehype failed.
    if npm view "${PACKAGE_NAME}@${PACKAGE_VERSION}" version --prefer-online > /dev/null 2>&1; then
        print_success "${PACKAGE_NAME}@${PACKAGE_VERSION} is already on npm - skipping"
    else
        print_status "Publishing ${PACKAGE_NAME}@${PACKAGE_VERSION}"
        pushd "$dir" > /dev/null
        verify_packed_manifest
        bun publish --access public
        popd > /dev/null

        # 'bun publish' can exit 0 after a failed browser authentication, leaving
        # the version unpublished. Without this check the script tags a release
        # that is not on the registry.
        print_status "Verifying ${PACKAGE_NAME}@${PACKAGE_VERSION} reached the registry"
        if ! verify_published_package "${PACKAGE_NAME}@${PACKAGE_VERSION}"; then
            print_error "Could not confirm ${PACKAGE_NAME}@${PACKAGE_VERSION} on the registry after 6 attempts."
            print_error "Re-run this script to retry the publish step."
            exit 1
        fi
        print_success "${PACKAGE_NAME}@${PACKAGE_VERSION} is live on npm"
    fi

    TAG="${PACKAGE_NAME}@${PACKAGE_VERSION}"
    git rev-parse -q --verify "refs/tags/$TAG" > /dev/null || git tag "$TAG"
done

git push --tags

echo
print_success "Release completed successfully!"
