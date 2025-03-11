const express = require('express');


// Datapoint Adminsitation
const report_route = require('./routes/Datapoint Administation/report_route');
const entity_route = require('./routes/Datapoint Administation/entity_route');
const flag_route = require('./routes/Datapoint Administation/flag_route');
const event_route = require('./routes/Datapoint Administation/event_route');
const datapoint_route = require('./routes/Datapoint Administation/datapoint_route');
const idt_route = require('./routes/Datapoint Administation/idt_route');
const instance_route = require('./routes/Datapoint Administation/instance_route');
const template_route = require('./routes/Datapoint Administation/template_route');
const sensor_route = require('./routes/Datapoint Administation/sensor_route');
const entity_data_route = require('./routes/Datapoint Administation/entity_data_route.js');


// Organization Administration

const organization_route = require('./routes/Organization Administration/organization_route');
const roles_route = require('./routes/Organization Administration/roles_route');
const users_route = require('./routes/Organization Administration/users_route');
const shift_route = require('./routes/Organization Administration/shift_route');
const group_route = require('./routes/Organization Administration/group_route');
const app_route = require('./routes/Organization Administration/app_route');

// Generate PDF Reporta
const pdfReport_route = require('./routes/PDFReports/PDFReport_route.js');

// Authorization
const auth_route = require('./routes/Auth/auth_route');

const connectToMongoDB = require('./config/connection');
const cors = require('cors');
const app = express();

//Env File 
require('dotenv').config();
app.use(cors()); // Enable CORS for all routes

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "*");
  res.header("Access-Control-Allow-Headers", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === 'OPTIONS') {
      return res.status(200).json({}

      );
  }
  next();
});

const PORT = process.env.PORT;

// Middleware to parse JSON bodies
// app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.json({ limit: '100mb' })); // Increased to 100MB
app.use(express.json());
app.use(express.text({ 
    type: 'text/html', 
    limit: '50mb'  // Increase the limit to 50MB or adjust according to your needs
}));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

async function startApp() {
  try {
    await connectToMongoDB();
    console.log('MongoDB Connected Successfully');

    // Start Express server after successful DB connection
    const port = process.env.PORT || 8080;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  }
}


// Datapoint Administration Routes
app.use('/report', report_route);
app.use('/entity', entity_route);
app.use('/flag', flag_route);
app.use('/datapoint', datapoint_route);
app.use('/event', event_route);
app.use('/idt', idt_route);
app.use('/instance', instance_route);
app.use('/template', template_route);
app.use('/sensor', sensor_route);
app.use('/entityData', entity_data_route);

// Organization Administration Routes
app.use('/organization', organization_route);
app.use('/roles', roles_route);
app.use('/users', users_route);
app.use('/shift', shift_route);
app.use('/group', group_route);
app.use('/app', app_route);

// Authorization
app.use('/auth', auth_route);

// Generate PDF Reports
app.use('/pdf', pdfReport_route);

startApp();
