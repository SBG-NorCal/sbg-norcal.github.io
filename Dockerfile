# =========================================================================
# Local dev container for SBG NorCal × MATS Jekyll site.
# Matches the Ruby version pinned in .ruby-version + the gems in Gemfile.lock,
# so the local Docker build is byte-identical to a contributor's native build.
#
# Usage (no docker compose required):
#   docker build -t sbg-mats-site .
#   docker run --rm -it -v "$PWD":/site -p 4000:4000 sbg-mats-site
#
# Or just use docker compose (preferred — see docker-compose.yml).
# =========================================================================

FROM ruby:3.4-slim

# Build deps for native gems (ffi, eventmachine, etc.) + git for github-pages gem
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
      build-essential \
      git \
      tzdata && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /site

# Install gems first for better layer caching
COPY Gemfile Gemfile.lock ./
RUN gem install bundler && bundle install --jobs 4 --retry 3

# The rest of the source is mounted at runtime via -v "$PWD":/site
COPY . .

EXPOSE 4000 35729

CMD ["bundle", "exec", "jekyll", "serve", \
     "--host", "0.0.0.0", \
     "--livereload", \
     "--force_polling"]
