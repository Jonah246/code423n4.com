// A script to validate data.
// Run with `yarn validate`.
const { readFile, stat } = require("fs/promises");
const path = require("path");
const glob = require("tiny-glob");
const csv = require("csvtojson");

async function getUniqueHandles() {
  const handles = await glob("./_data/handles/*.json");
  const uniqueHandles = new Set();
  for (const handleFile of handles) {
    const blob = await readFile(handleFile);
    let parsedHandle;
    try {
      parsedHandle = JSON.parse(blob);
    } catch (err) {
      console.error(`Unable to parse JSON file at ${handleFile}`);
      continue;
    }

    uniqueHandles.add(parsedHandle.handle);
  }

  return uniqueHandles;
}

async function getUniqueContestIds() {
  const contests = await csv({
    colParser: {
      contestid: "number",
    },
  }).fromFile("./_data/contests/contests.csv");
  const uniqueContestIds = new Set();
  for (const parsedContest of contests) {
    uniqueContestIds.add(parsedContest.contestid);
  }

  return uniqueContestIds;
}

// Validate handles.
async function validateHandles() {
  const handles = await glob("./_data/handles/*.json");
  let passedValidation = true;
  for (const handleFile of handles) {
    const blob = await readFile(handleFile);
    let parsedHandle;
    try {
      parsedHandle = JSON.parse(blob);
    } catch (err) {
      console.error(`Unable to parse JSON file at ${handleFile}`);
      passedValidation = false;
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(parsedHandle, "handle")) {
      console.error(`Unable to find key "handle" in ${handleFile}`);
      passedValidation = false;
    }

    if (
      Object.prototype.hasOwnProperty.call(parsedHandle, "image") &&
      parsedHandle.image !== ""
    ) {
      if (!parsedHandle.image.startsWith("./avatars/")) {
        console.error(
          `"image" property must begin with "./avatars" in ${handleFile}. Found ${parsedHandle.image}.`
        );
        passedValidation = false;
      }

      try {
        await stat(
          path.join(path.resolve("./_data/handles"), parsedHandle.image)
        );
      } catch (err) {
        console.error(
          `Unable to read file from "image" key in ${handleFile}. Does "${parsedHandle.image}" exist?`
        );
        passedValidation = false;
      }
    }
  }

  if (!passedValidation) {
    throw new Error(
      "❌  Handle validation failed. See above log for more information."
    );
  }

  console.log("✅  Handle validation passed!");
}

// Validate teams.
async function validateTeams() {
  const uniqueHandles = await getUniqueHandles();
  const handles = await glob("./_data/handles/*.json");
  let passedValidation = true;
  for (const handleFile of handles) {
    const blob = await readFile(handleFile);
    let parsedHandle;
    try {
      parsedHandle = JSON.parse(blob);
    } catch (err) {
      console.error(`Unable to parse JSON file at ${handleFile}`);
      passedValidation = false;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(parsedHandle, "members")) {
      Array.prototype.forEach.call(parsedHandle.members, (member) => {
        if (!uniqueHandles.has(member)) {
          console.error(
            `Team specified in ${handleFile} has unregistered handle: ${member}`
          );
          passedValidation = false;
        }
      });
    }
  }

  if (!passedValidation) {
    throw new Error(
      "❌  Teams validation failed. See above log for more information."
    );
  }

  console.log("✅  Handle validation passed!");
}

async function validateOrganizations() {
  const orgs = await glob("./_data/orgs/*.json");
  let passedValidation = true;
  for (const orgFile of orgs) {
    const blob = await readFile(orgFile);
    let parsedOrg;
    try {
      parsedOrg = JSON.parse(blob);
    } catch (err) {
      console.error(`Unable to parse JSON file at ${orgFile}`);
      passedValidation = false;
      continue;
    }

    if (!Object.prototype.hasOwnProperty.call(parsedOrg, "image")) {
      console.error(`Unable to find key "image" in ${orgFile}`);
      passedValidation = false;
      continue;
    }

    try {
      await stat(path.join(path.resolve("./_data/orgs"), parsedOrg.image));
    } catch (err) {
      console.error(
        `Unable to read file from "image" key in ${orgFile}. Does "${parsedOrg.image}" exist?`
      );
      passedValidation = false;
    }
  }

  if (!passedValidation) {
    throw new Error(
      "❌  Organization validation failed. See above log for more information."
    );
  }

  console.log("✅  Organization validation passed!");
}

async function validateContests() {
  let passedValidation = true;

  const contests = await csv().fromFile("./_data/contests/contests.csv");
  const orgs = await glob("./_data/orgs/*.json");

  const registeredOrganizations = new Set();
  for (const orgFile of orgs) {
    const blob = await readFile(orgFile);
    let parsedOrg;
    try {
      parsedOrg = JSON.parse(blob);
    } catch (err) {
      console.error(`Unable to parse JSON file at ${orgFile}`);
      passedValidation = false;
      continue;
    }

    registeredOrganizations.add(parsedOrg.name);
  }

  const existingContestIds = new Set();
  for (const parsedContest of contests) {
    // Check that contest.sponsor is a registered organization.
    if (!registeredOrganizations.has(parsedContest.sponsor)) {
      console.error(
        `Contest at ${contestFile} uses unknown organization: ${parsedContest.sponsor}`
      );
      passedValidation = false;
      continue;
    }

    // Check that contest.contestid is unique.
    if (existingContestIds.has(parsedContest.contestid)) {
      console.error(
        `Contest at ${contestFile} uses duplicate contestid: ${parsedContest.contestid}`
      );
      passedValidation = false;
      continue;
    } else {
      existingContestIds.add(parsedContest.contestid);
    }
  }

  if (!passedValidation) {
    throw new Error(
      "❌  Contests validation failed. See above log for more information."
    );
  }

  console.log("✅  Contest validation passed!");
}

async function validateFindings() {
  let passedValidation = true;
  const findingsFile = "./_data/findings/findings.json";
  const blob = await readFile(findingsFile);
  let parsedFindings;
  try {
    parsedFindings = JSON.parse(blob);
  } catch (err) {
    console.error(`Unable to parse JSON file at ${findingsFile}`);
    passedValidation = false;
  }

  const uniqueHandles = await getUniqueHandles();
  const uniqueContestIds = await getUniqueContestIds();

  const unknownHandles = new Set();
  const unknownContestIds = new Set();
  for (const finding of parsedFindings) {
    if (!uniqueHandles.has(finding.handle)) {
      unknownHandles.add(finding.handle);
      passedValidation = false;
      continue;
    }

    if (!uniqueContestIds.has(finding.contest)) {
      unknownContestIds.add(finding.contestid);
      passedValidation = false;
      continue;
    }
  }

  if (unknownHandles.size > 0) {
    console.error(`Found ${unknownHandles.size} unknown handles:`);
    console.log(unknownHandles);
  }

  if (unknownContestIds.size > 0) {
    console.error(`Found ${unknownContestIds.size} unknown contestids:`);
    console.log(unknownContestIds);
  }

  if (!passedValidation) {
    throw new Error(
      "❌  Findings validation failed. See above log for more information."
    );
  }

  console.log("✅  Findings validation passed!");
}

(async () => {
  try {
    await validateHandles();
    await validateTeams();
    await validateOrganizations();
    await validateContests();
    await validateFindings();
    console.log("Validation passed!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
