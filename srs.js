const crypto = require("crypto");

class SRSRewriter {
  constructor({ key, prefix, domain }) {
    this.srsKey = key;
    this.srsPrefix = prefix;
    this.alphabet32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
    this.srsDomain = domain ? "@" + domain : "";
  }

  parseEmail(email) {
    const match = email.match(/^([^@]+)@(.+)$/);
    if (!match) {
      const error = new Error("Invalid email format");
      error.code = "INVALID_EMAIL_FORMAT";
      throw error;
    }
    return {
      username: match[1],
      domain: match[2],
    };
  }

  timestamp2date(timestamp) {
    const currentDays = Math.floor(Date.now() / 1000 / (60 * 60 * 24));

    const currentMod = currentDays % 1024;
    let matchingDay;
    if (timestamp <= currentMod) {
      // The timestamp is in the current cycle
      matchingDay = currentDays - (currentMod - timestamp);
    } else {
      // The timestamp is from the previous cycle
      matchingDay = currentDays - (currentMod + (1024 - timestamp));
    }

    // Convert back to actual date
    const matchingDate = new Date(matchingDay * 24 * 60 * 60 * 1000);
    return matchingDate.toISOString().substring(0, 10);
  }

  date2timestamp(date) {
    if (!date) return Date.now();
    const dateMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!dateMatch) {
      const error = new Error("Invalid date format. Expected YYYY-MM-DD, got" + date);
    error.code = "INVALID_DATE_FORMAT";
    throw error;
    }

    const [, year, month, day] = dateMatch;
    const dateObj = new Date(
      Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)),
    );

    // Validate the date is valid
    if (
      dateObj.getFullYear() != year ||
      dateObj.getMonth() != month - 1 ||
      dateObj.getDate() != day
    ) {
      const error = new Error("Invalid date provided");
    error.code = "INVALID_DATE_PROVIDED";
    throw error;
    }
    return dateObj;
  }

  is(srsAddress) {
    //check the format
    try {
      this.getParts(srsAddress);
      return true;
    } catch (e) {
      return false;
    }
  }

  getParts(srsAddress) {
    const localPart = srsAddress.split("@")[0];

    const parts = localPart.split("=");

    if (parts.length !== 5) {
      const error = new Error("Invalid SRS format: expected 5 parts separated by =");
    error.code = "INVALID_SRS_FORMAT";
    throw error;
    }

    return {
      prefix: parts[0],
      hash: parts[1],
      encodedTimestamp: parts[2],
      domain: parts[3],
      username: parts[4],
    };
  }

  decode(srsAddress) {
    const d = this.getParts(srsAddress);

    if (d.prefix !== this.srsPrefix) {
      const error = new Error(`SRS prefix mismatch: expected ${this.srsPrefix}, got ${d.prefix}`);
    error.code = "INVALID_PREFIX";
    throw error;
    }

    // can throw an error
    const timestamp = this.decodeInt32(d.encodedTimestamp);

    // Verify hash
    const expectedHash = crypto
      .createHmac("sha1", this.srsKey)
      .update(d.encodedTimestamp + d.domain + d.username)
      .digest("hex")
      .toUpperCase()
      .slice(0, 4);

    if (d.hash !== expectedHash) {
      const error = new Error("SRS has verification failed: invalid secret key or corrupted SRS address");
      error.code = "INVALID_SRS";
      throw error;
    }

    return {
      date: this.timestamp2date(timestamp),
      email: d.username + "@" + d.domain,
    };
  }

  encode(email, date) {
    const { username, domain } = this.parseEmail(email);
    const unixTime = this.date2timestamp(date);
    const timestamp = this.encodeInt32(
      Math.floor(unixTime / 1000 / (60 * 60 * 24)) % 1024,
    );
    const hash = crypto
      .createHmac("sha1", this.srsKey)
      .update(timestamp + domain + username)
      .digest("hex")
      .toUpperCase()
      .slice(0, 4);

    return `${this.srsPrefix}=${hash}=${timestamp}=${domain}=${username}${this.srsDomain}`;
  }

  decodeInt32(encoded) {
    let result = 0;
    for (let i = 0; i < encoded.length; i++) {
      const char = encoded[i];
      const value = this.alphabet32.indexOf(char);
      if (value === -1) {
        const error = new Error(`Invalid character in encoded timestamp: ${char}`);
        error.code = "INVALID_TIMESTAMP";
        throw error;
      }
      result = result * 32 + value;
    }
    return result;
  }

  encodeInt32(n, acc = "") {
    if (n === 0) return acc || "A"; // Return "A" for 0 if acc is empty
    return this.encodeInt32(Math.floor(n / 32), this.alphabet32[n % 32] + acc);
  }
}

module.exports = SRSRewriter;
