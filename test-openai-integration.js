#!/usr/bin/env node

/**
 * Simple test script to verify OpenAI integration
 * Run with: node test-openai-integration.js
 */

const OpenAI = require('openai');

async function testOpenAI() {
  console.log('🧪 Testing OpenAI Integration...\n');

  // Check for API key
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable not set');
    console.log('💡 Set it with: export OPENAI_API_KEY=your_api_key_here');
    process.exit(1);
  }

  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    console.log('✅ OpenAI client initialized');

    // Test simple completion with gpt-4o-mini (highest rate limits)
    console.log('🤖 Making test API call with gpt-4o-mini...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using gpt-4o-mini for highest rate limits
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant. Respond briefly and professionally.'
        },
        {
          role: 'user',
          content: 'Hello! Can you confirm you are working?'
        }
      ],
      max_tokens: 30, // Very short response to minimize cost
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    
    if (content) {
      console.log('✅ OpenAI API call successful!');
      console.log('📝 Response:', content);
      console.log('\n🎉 OpenAI integration is working correctly!');
      console.log('💡 You can now use gpt-4 for production by setting OPENAI_MODEL=gpt-4');
    } else {
      throw new Error('No content received from OpenAI');
    }

  } catch (error) {
    console.error('❌ OpenAI test failed:', error.message);
    
    if (error.message.includes('401')) {
      console.log('💡 This usually means your API key is invalid or expired');
    } else if (error.message.includes('429')) {
      console.log('💡 Rate limit exceeded. This can happen with pay-as-you-go accounts');
      console.log('💡 Try again in a few minutes, or check your usage at: https://platform.openai.com/account/usage');
      console.log('💡 You may need to add a payment method or verify your account');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('💡 Network connectivity issue. Check your internet connection');
    }
    
    process.exit(1);
  }
}

// Run the test
testOpenAI(); 