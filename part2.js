var http = require('http');
var url = require('url');
var qs = require('querystring');
var fs = require('fs');
const MongoClient = require('mongodb').MongoClient;
var port = process.env.PORT || 3000;

// MongoDB connection URI
const uri = 'mongodb+srv://connorg2404:Tusd2026@cs20-hw13.be1nl.mongodb.net/?retryWrites=true&w=majority&appName=CS20-HW13';

http.createServer(async function (req, res) {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db('Stock');
    const collection = db.collection('PublicCompanies');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    var urlObj = url.parse(req.url, true);
    var path = urlObj.pathname;

    // Home page - Display the form
    if (path == "/") {
        file = "form.html";
        fs.readFile(file, function(err, home) {
            res.write(home);
            res.end();
        })
    }

    // Process page
    else if (path == "/process") {
        // Get the data from the form
        var query = urlObj.query;
        var searchTerm = query.search.trim();
        var searchType = query.type;

        // Connect to MongoDB and search
        try {
            // Query the database based on search type (case-insensitive)
            let dbQuery = {};
            if (searchType === 'ticker') {
                dbQuery = { stockTicker: { $regex: searchTerm, $options: 'i' } };
            } else if (searchType === 'name') {
                dbQuery = { companyName: { $regex: searchTerm, $options: 'i' } };
            }

            // Get and display results
            const results = await collection.find(dbQuery).toArray();
            res.write('<h1>Search Results</h1>');
            if (results.length === 0) {
                res.write('<p>No results found.</p>');
            } else {
                res.write('<ul>');
                results.forEach((result) => {
                    res.write(`
                        <li>
                        <strong>Company:</strong> ${result.companyName} |
                        <strong>Ticker:</strong> ${result.stockTicker} |
                        <strong>Price:</strong> $${result.stockPrice.toFixed(2)}
                        </li>
                    `);
                });
                res.write('</ul>');
            }
            res.write('<a href="/">Back to Home</a>');
            res.end();
        } catch (error) {
            console.error('Error processing request:', error.message);
            res.write('<p>An error occurred while processing your request.</p>');
            res.end();
        } finally {
            client.close();
        }
    }
}).listen(port);
