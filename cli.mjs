#!/usr/bin/env node

import { config } from "dotenv";
import minimist from "minimist";
import SRS from "./srs.mjs";

if (process.env.NODE_ENV !== 'test') {
  config({ quiet: true, debug: false });
}

function showHelp() {
  //-t, --time <timestamp> Unix timestamp in milliseconds (default: current time)
  //node srs-cli.js -t 1640995200000 user@example.com
  console.log(`
SRS Email Rewriter CLI

Usage: node srs-cli.js [options] <email>

Options:
  -k, --key <key>        SRS secret key (overrides SRS_KEY env var)
  -p, --prefix <prefix>  SRS prefix (overrides SRS_PREFIX env var, default: SRS0)
  -d, --date <date> default: today
  --domain <domain>  domain for the generated SRS email
  --validity <days>  SRS validity in days (overrides SRS_VALIDITY_DAYS env var, default: 90)
  -h, --help            Show this help message

Environment Variables:
  SRS_KEY     - SRS secret key
  SRS_DOMAIN  - SRS email domain (@example.org)
  SRS_PREFIX  - SRS prefix (default: SRS0)
  SRS_VALIDITY_DAYS - SRS validity in days (default: 90)

Examples:
  ./cli.js user@example.com
  ./cli.js -k "my-secret-key" user@example.com
  ./cli.js --prefix "SRS1" user@example.com
  ./cli.js  user@example.com -d 2025-01-31

Note: Command line parameters override environment variables.
`);
}

function main() {
  const argv = minimist(process.argv.slice(2), {
    alias: {
      k: "key",
      p: "prefix",
      d: "date",
      h: "help",
    },
  });

  if (argv.help) {
    showHelp();
    process.exit(0);
  }

  // Get configuration from env vars first, then override with CLI params
  const srsKey = argv.key || process.env.SRS_KEY;
  const srsPrefix = argv.prefix || process.env.SRS_PREFIX || "SRS0";
  const srsDomain = argv.domain || process.env.SRS_DOMAIN;
  const srsValidityDays = argv.validity || process.env.SRS_VALIDITY_DAYS || 90;

  if (!srsKey) {
    console.error(
      "Error: SRS key is required. Set SRS_KEY environment variable or use -k/--key parameter.",
    );
    console.error("Use --help for usage information.");
    process.exit(1);
  }

  if (argv._.length === 0) {
    console.error("Error: Email address is required.");
    console.error("Use --help for usage information.");
    process.exit(1);
  }

  const email = argv._[0];

  const srs = new SRS({ key: srsKey, prefix: srsPrefix, domain: srsDomain, validityDays: srsValidityDays });
  if (srs.is(email)) {
    try {
      const address = srs.decode(email);
      console.log(address.email, address.date);
    } catch (error) {
      if (error.code) {
        console.error(`Error: \x1b[31m${error.code}\x1b[0m ${error.message}`);
      } else {
        console.error(`Error: ${error.message}`);
      }
    }
    return;
  }

  try {
    const srsAddress = srs.encode(email, argv.date);

    console.log(srsAddress);
  } catch (error) {
    if (error.code) {
      console.error(`Error: \x1b[31m${error.code}\x1b[0m ${error.message}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

if (import.meta.url.startsWith('file:') && process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}
