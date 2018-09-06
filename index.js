//include modules
const cors = require('cors'),
express = require('express'),
mongoose = require('mongoose'),
bodyParser = require('body-parser'),
app = express();
app.use(express.static('static'));
app.use(bodyParser.json());
//include remote
const corsOptions = {
  origin: 'http://front-test.gq',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
//mongo connect
let db = mongoose.createConnection('mongodb://dbRoman:***@localhost:27017/admin');
//app turn on
const port = 8080;
app.listen(port, () => {
  console.log(`App started on port ${port}`);
});
//GET give the existing list
app.get('/api/issues', (req, res) => {

  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.effort_lte || req.query.effort_gte) filter.effort = {};
  if (req.query.effort_lte) filter.effort.$lte = parseInt(req.query.effort_lte, 10);
  if (req.query.effort_gte) filter.effort.$gte = parseInt(req.query.effort_gte, 10);

  db.collection('issues').find(filter).toArray().then(issues => {
    const metadata = { total_count: issues.length };
    res.json({ _metadata: metadata, records: issues });
  }).catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});
//GET give the existing issue
app.get('/api/issues/:id', (req, res) => {
  let issueId;
  try {
    issueId = new mongoose.Types.ObjectId(req.params.id);
  } catch (error) {
    res.status(422).json({ message: `Invalid issue ID format: ${error}` });
    return;
  }
  db.collection('issues').find({ _id: issueId }).limit(1).next().then(issue => {
    if (!issue) res.status(404).json({ message: `No such issue: ${issueId}` });
    else res.json(issue);
  }).catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});
//POST take and give
app.post('/api/issues', (req, res) => {

  const Issue = require('./server/issue.js');
  const newIssue = req.body;
  newIssue.created = new Date();
  if (!newIssue.status) newIssue.status = 'New';
  
  const err = Issue.validateIssue(newIssue);
  if (err) { res.status(422).json({ message: `Invalid request: ${err}` });
    return;
  }

  db.collection('issues').insertOne(Issue.cleanupIssue(newIssue)).then(result =>
    db.collection('issues').find({ _id: result.insertedId }).limit(1).next()
  ).then(savedIssue => {
    res.json(savedIssue);
  }).catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
});

/*app.get('/api/agents', (req, res) => {

  const filter = {};
  db.collection('agents').find(filter).toArray().then(agents => {
 
    res.json(agents);
  }).catch(error => {
    console.log(error);
    res.status(500).json({ message: `Internal Server Error: ${error}` });
  });
} */

//rooter start with static page
const path = require('path');
app.get('*', (req, res) => { 
 res.sendFile(path.resolve('./static/index.html')); });