#!/usr/bin/env bash

# Verify the tarball bun would publish has no unresolved workspace protocol.
#
# `bun publish` rewrites `workspace:*` to the linked package version, but only
# when the workspace resolves at publish time. If it does not (missing install,
# publishing from a worktree without node_modules), the literal `workspace:*`
# ships to npm and every consumer install fails to resolve it.
#
# Call from inside the package directory, before publishing.
verify_packed_manifest() {
    local pack_dir packed_tgz packed_manifest

    pack_dir=$(mktemp -d)
    bun pm pack --destination "$pack_dir" > /dev/null
    packed_tgz=$(find "$pack_dir" -name '*.tgz' | head -n1)

    if [ -z "$packed_tgz" ]; then
        rm -rf "$pack_dir"
        print_error "Could not pack the package for verification."
        exit 1
    fi

    packed_manifest=$(tar -xzOf "$packed_tgz" package/package.json)
    rm -rf "$pack_dir"

    if echo "$packed_manifest" | grep -q '"workspace:'; then
        print_error "Packed manifest still contains the workspace protocol - aborting publish."
        echo "$packed_manifest" | grep '"workspace:'
        print_error "Run 'bun install' at the repo root, then retry."
        exit 1
    fi

    print_success "Packed manifest dependencies resolved"
}
