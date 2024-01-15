// app.js
const express = require('express');
const bodyParser = require('body-parser');
const MindsDB = require("mindsdb-js-sdk").default;
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Parse JSON requests
app.use(bodyParser.json());

try {
   MindsDB.connect({
    user: 'patriotkgotlafela@gmail.com',
    password: 'Tilolo#97!'
  });
  console.log('Connected to Mindsdb Cloud');
} catch(error) {
  // Failed to authenticate.
  console.log('Failed to authenticate to Mindsdb Cloud');

}

// Define a route to handle webhook requests
app.post('/webhook', async (req, res) => {
  try {
    // Process the incoming webhook payload
    const webhookData = req.body;
    console.log('Webhook received:', webhookData);

    // Add your custom logic here (e.g., trigger MindsDB prediction)
    const regressionTrainingOptions = {
      select: 'SELECT * FROM files.event_data',
      integration: 'files'
    };

    // Train the model asynchronously
    //let eventCostModel = await MindsDB.Models.trainModel(
    //  'cotmodels',
    //  'cost',
    //  'mindsdb',
     // regressionTrainingOptions
    //);

    // Fetch the existing model
let eventCostModel = await MindsDB.Models.getModel('event_costs_model', 'mindsdb');


    // Wait for the training to be complete (consider adding a timeout mechanism)
    while (eventCostModel.status !== 'complete' && eventCostModel.status !== 'error') {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second
      eventCostModel = await MindsDB.Models.getModel('event_costs_model', 'mindsdb');
    }
    
    function getValueByFieldId( fieldId) {

    
      for (let answer of webhookData.form_response.answers) {
        if (answer.field && answer.field.id === fieldId) {
          if (answer.type === 'email') {
            return answer.email;
          } else if (answer.type === 'phone_number') {
            return answer.phone_number;
          } else if (answer.type === 'number') {
            return answer.number;
          } else if (answer.type === 'text') {
            return answer.text;
          }
        }
      }
    
      return null; // Return null or appropriate value if not found
    }
// Define query options

const eventType = getValueByFieldId('2bABtJQgJfA9');
const location = getValueByFieldId('fzgCinjspKFf');
const attendees = getValueByFieldId('wbjnYzwsqmKa');
const decorationTheme = getValueByFieldId('v0ioNij9bfgm');
const duration = getValueByFieldId('YmJe1PakNxAb');
const userName = getValueByFieldId('ugyT5lEXjYO1');

    const queryOptions = {
      where: [
        `event_type = "${eventType}"`,
        `location = "${location}"`,
        `attendees = ${attendees}`,
        `decorationtheme = "${decorationTheme}"`,
        `duration = ${duration}`
      ]
  };
  console.log('webhookData.answers:', webhookData.form_response.answers);
    // Query the model for predictions
    const eventCostPrediction = await eventCostModel.query(queryOptions);
    console.log('Predicted Cost:', eventCostPrediction.value);
    console.log('Explanation:', eventCostPrediction.explain);
    console.log('Raw Data:', eventCostPrediction.data);

  //send predicted cost by email to user
  const userEmailAnswer = webhookData.form_response.answers.find(answer => answer.type === 'email');
 

  if (!userEmailAnswer || !userEmailAnswer.email) {
    console.error('User email not found in answers array.');
    res.status(400).send('Bad Request');
    return;
  }
  
  const userEmail = userEmailAnswer.email;

  // Send email with the predicted cost
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'patriotkgotlafela@gmail.com', // replace with your email
      pass: 'ejvh yobq ials qhan' // replace with your email password or app-specific password
    }
  });

  const mailOptions = {
    from: 'patriotkgotlafela@gmail.com',
    to: userEmail,
    subject: '🎉 Your Predicted Event Cost',
   // text: `The predicted cost of your event is: $${eventCostPrediction.value}`,
    text: `
Dear ${userName},

We hope this message finds you well! 🌟

Thank you for using our service to predict the cost of your upcoming event. Based on the details you provided, our prediction model has estimated the cost for your event.

Predicted Event Cost: $${eventCostPrediction.value}

Please note that this is an estimate, and actual costs may vary. If you have any further questions or need assistance with planning your event, feel free to reach out to us.

We appreciate your trust in our service and wish you a fantastic and memorable event!

Best regards,

MindsEvents
  `
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Failed to send email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });

    res.status(200).send('Webhook received successfully.');
  } catch (error) {
    console.error('Failed to do predictions:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 
