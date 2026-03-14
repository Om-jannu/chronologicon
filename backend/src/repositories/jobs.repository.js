const sql = require("../config/db");

async function createJob(jobId, status, metadata) {
  await sql`
    INSERT INTO ingestion_jobs (job_id, status, metadata)
    VALUES (${jobId}, ${status}, ${sql.json(metadata)})
  `;
}

async function updateJob(jobId, status, metadata) {
  await sql`
    UPDATE ingestion_jobs
    SET status = ${status},
        metadata = ${sql.json(metadata)},
        updated_at = NOW()
    WHERE job_id = ${jobId}
  `;
}

async function getJob(jobId) {
  const [row] = await sql`
    SELECT job_id, status, metadata
    FROM ingestion_jobs
    WHERE job_id = ${jobId}
  `;
  return row;
}

module.exports = { createJob, updateJob, getJob };
