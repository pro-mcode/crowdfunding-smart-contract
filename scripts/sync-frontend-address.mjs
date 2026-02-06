import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const BROADCAST_DIR = path.join(ROOT, "broadcast", "DeployFundMe.s.sol");
const FRONTEND_DEPLOYMENTS = path.join(
  ROOT,
  "crowdfunding-frontend",
  "src",
  "lib",
  "deployments.json"
);

const getRunLatestFiles = () => {
  if (!fs.existsSync(BROADCAST_DIR)) {
    return [];
  }
  return fs
    .readdirSync(BROADCAST_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(BROADCAST_DIR, entry.name, "run-latest.json"))
    .filter((filePath) => fs.existsSync(filePath));
};

const getFundMeAddress = (data) => {
  if (data?.returns?.["0"]?.value) {
    return data.returns["0"].value;
  }
  const tx = [...(data?.transactions ?? [])]
    .reverse()
    .find(
      (entry) =>
        entry?.contractName === "PherconsVault" &&
        entry?.contractAddress &&
        entry?.transactionType === "CREATE"
    );
  return tx?.contractAddress ?? null;
};

const run = () => {
  const files = getRunLatestFiles();
  if (files.length === 0) {
    console.error("No broadcast run-latest.json files found.");
    process.exit(1);
  }

  const deployments = {};
  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    const address = getFundMeAddress(data);
    if (!address || !data?.chain) {
      continue;
    }
    deployments[String(data.chain)] = {
      address,
      updatedAt: data.timestamp ?? Date.now(),
      source: path.relative(ROOT, filePath),
    };
  }

  if (Object.keys(deployments).length === 0) {
    console.error("No FundMe deployments found in broadcasts.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(FRONTEND_DEPLOYMENTS), { recursive: true });
  fs.writeFileSync(FRONTEND_DEPLOYMENTS, `${JSON.stringify(deployments, null, 2)}\n`);
  console.log(`Wrote ${FRONTEND_DEPLOYMENTS}`);
};

run();
