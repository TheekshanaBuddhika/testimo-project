import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { pool } from '../lib/db';

async function run() {
  console.log('Testing Testimo Features...');

  try {
    // 1. Create a fake user
    const [userRes]: any = await pool.execute(`INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User') ON DUPLICATE KEY UPDATE name='Test User'`);
    const [userRow]: any = await pool.execute(`SELECT id FROM users WHERE email='test@example.com'`);
    const userId = userRow[0].id;

    // 2. Create a fake workspace
    const workspaceId = crypto.randomUUID();
    await pool.execute(`INSERT INTO workspaces (id, owner_id, name, slug) VALUES (?, ?, 'Test Workspace', 'test-ws')`, [workspaceId, userId]);
    await pool.execute(`INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, 'owner')`, [workspaceId, userId]);

    // 3. Create a fake form
    const formId = crypto.randomUUID();
    const questions = JSON.stringify([{ id: '1', label: 'Rate it', type: 'rating', required: true }]);
    await pool.execute(`INSERT INTO collection_forms (id, workspace_id, title, questions) VALUES (?, ?, 'Test Form', ?)`, [formId, workspaceId, questions]);

    // 4. Create fake testimonials
    const tId1 = crypto.randomUUID();
    await pool.execute(
      `INSERT INTO testimonials (id, workspace_id, submitter_name, content, rating, status, is_featured) 
       VALUES (?, ?, 'Alice', 'Amazing product!', 5, 'approved', true)`, 
      [tId1, workspaceId]
    );
    const tId2 = crypto.randomUUID();
    await pool.execute(
      `INSERT INTO testimonials (id, workspace_id, submitter_name, content, rating, status, is_featured) 
       VALUES (?, ?, 'Bob', 'Could be better', 3, 'pending', false)`, 
      [tId2, workspaceId]
    );

    console.log('✅ Fake data created successfully');

    // 5. Test the public widget API
    console.log(`Fetching widget API for workspace: ${workspaceId}...`);
    const res = await fetch(`http://localhost:3001/api/workspaces/${workspaceId}/widget`);
    const data = await res.json();
    
    if (res.ok && data.testimonials.length === 1 && data.testimonials[0].submitter_name === 'Alice') {
      console.log('✅ Widget API is working perfectly and filtering correctly!');
    } else {
      console.error('❌ Widget API failed or returned wrong data:', data);
    }

    // Cleanup
    await pool.execute('DELETE FROM workspaces WHERE id = ?', [workspaceId]);
    await pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    console.log('✅ Cleanup done');

    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

run();
