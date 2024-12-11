var http = require('http');
var url = require('url');
var fs = require('fs');
var { MongoClient } = require('mongodb');
var port = process.env.PORT || 3000;

// MongoDB connection URI
var uri = 'mongodb+srv://connorg2404:Tusd2026@cs20-hw13.be1nl.mongodb.net/?retryWrites=true&w=majority&appName=CS20-HW13';
var client;

async function connectToDB() {
    client = new MongoClient(uri);
    await client.connect();
}

// Create a server
var server = http.createServer(async (req, res) => {
    var urlObj = url.parse(req.url, true);
    var path = urlObj.pathname;

    // Home page - Display the form
    if (path === "/") {
        fs.readFile("form.html", (err, home) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading form.');
                return;
            }
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(home);
        });
    } 
    // Process page
    else if (path === "/process") {
        var query = urlObj.query;
        var searchTerm = query.search.trim();
        var searchType = query.type;

        try {
            var db = client.db('Stock');
            var collection = db.collection('PublicCompanies');

            // Build query based on search type
            var dbQuery = {};
            if (searchType === 'ticker') {
                dbQuery = { stockTicker: { $regex: searchTerm, $options: 'i' } };
            } else if (searchType === 'name') {
                dbQuery = { companyName: { $regex: searchTerm, $options: 'i' } };
            }

            var results = await collection.find(dbQuery).toArray();
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.write('<h1>Search Results</h1>');
            if (results.length === 0) {
                res.write('<p>No results found.</p>');
            } else {
                res.write('<ul>');
                results.forEach(result => {
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
            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end('<p>An error occurred while processing your request.</p>');
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<p>404 Not Found</p>');
    }
});

// Start the MongoDB connection and server
connectToDB()
.then(() => {
    server.listen(port, () => {
        console.log(`Server running on port ${port}`);
});
})
.catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit the process if we cannot connect to the DB
});