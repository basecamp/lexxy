# Lexxy Agent Instructions

## Asset Merge Conflicts

Lexxy's compiled JS assets (`app/assets/javascript/lexxy.js`, `lexxy.min.js`,
and their `.gz`/`.br` variants) are binary files that cannot be auto-merged.

When resolving merge conflicts with these files:
1. Accept **ours**: `git checkout --ours app/assets/javascript/`
2. Rebuild assets: `yarn build`
3. Stage the rebuilt files: `git add app/assets/javascript/`
