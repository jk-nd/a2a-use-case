const axios = require('axios');
const fs = require('fs');
const JSZip = require('jszip');
const FormData = require('form-data');

async function testManagementAPI() {
  console.log('🧪 Testing NPL Management API directly...\n');

  try {
    // Read the token
    const token = fs.readFileSync('tests/test-token.txt', 'utf8').trim();
    console.log('✅ Token loaded');

    // Read the RFP protocol file
    const nplCode = fs.readFileSync('src/main/npl-1.0.0/rfp_workflow/rfp_protocol.npl', 'utf8');
    console.log('✅ RFP protocol file loaded');

    // Create ZIP file
    const zip = new JSZip();
    const nplPath = `src/main/npl-1.0.0/rfp_workflow/RfpWorkflow.npl`;
    zip.file(nplPath, nplCode);
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    console.log('✅ ZIP file created');

    // Create FormData
    const form = new FormData();
    form.append('archive', zipBuffer, {
      filename: 'rfp_workflow-RfpWorkflow.zip',
      contentType: 'application/zip'
    });
    console.log('✅ FormData created');

    // Test direct deployment
    console.log('📤 Deploying to NPL management API...');
    const response = await axios.post('http://localhost:12400/management/application', form, {
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      validateStatus: function (status) {
        return status < 500; // Accept all status codes less than 500
      }
    });

    console.log('📋 Response status:', response.status);
    console.log('📋 Response headers:', response.headers);
    console.log('📋 Response data:', response.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Headers:', error.response.headers);
      console.error('📋 Data:', error.response.data);
    }
  }
}

testManagementAPI(); 