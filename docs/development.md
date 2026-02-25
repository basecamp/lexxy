---
title: Development
layout: default
nav_order: 7
---

# Development

## Local development

To build the JS source when it changes, run:

```bash
yarn build -w
```

To the sandbox app:

```bash
bin/rails server
```

The sandbox app is available at http://lexxy.localhost:3000. There is also a CRUD example at http://lexxy.localhost:3000/posts.

## Documentation

To run the documentation site locally:

```bash
cd docs
bundle install
bundle exec jekyll serve
```

The docs will be available at http://localhost:4000/lexxy/.

## Release

### Gem

1. Update the version in `version.rb`
2. Run `bundle` to update `Gemfile.lock`
3. Commit the version bump
4. Run `rake release` to publish the gem

### NPM package

```bash
yarn release
```

### Create release in GitHub

Create [a new release in GitHub](https://github.com/basecamp/lexxy/releases). 

While in beta we are flagging the releases as pre-release.
