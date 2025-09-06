const storeParserMiddleware = (req, res, next) => {
  console.log("hi");
  try {
    // Parse location if sent as JSON string in form-data
    if (req.body.location && typeof req.body.location === 'string') {
      console.log("Parsing location...", req.body.location);
      try {
        req.body.location = JSON.parse(req.body.location);
      } catch (err) {
        console.error("Invalid JSON for location:", err.message);
        return res.status(400).json({ message: 'Invalid JSON in location field.' });
      }
    }

    // Parse coordinates if needed (string or array of strings)
    if (
      req.body.location &&
      req.body.location.coordinates &&
      req.user?.role === "ADMIN"
    ) {
      const coords = req.body.location.coordinates;

      if (typeof coords === 'string') {
        // Example: "31.656595,26.69223"
        try {
          req.body.location.coordinates = coords.split(',').map(Number);
          console.log("Parsed string coordinates:", req.body.location.coordinates);
        } catch (err) {
          console.error("Invalid coordinates string:", err.message);
          return res.status(400).json({ message: 'Invalid coordinates format.' });
        }
      } else if (Array.isArray(coords)) {
        // Example: ['31.656595', '26.69223'] => convert each to Number
        try {
          req.body.location.coordinates = coords.map(c => typeof c === 'string' ? Number(c) : c);
          console.log("Parsed array coordinates:", req.body.location.coordinates);
        } catch (err) {
          console.error("Invalid coordinates array:", err.message);
          return res.status(400).json({ message: 'Invalid coordinates array.' });
        }
      }
    }

    // Parse policies
    if (req.body.policies && typeof req.body.policies === 'string') {
      try {
        req.body.policies = JSON.parse(req.body.policies);
        console.log("Parsed policies:", req.body.policies);
      } catch (err) {
        console.error("Invalid JSON for policies:", err.message);
        return res.status(400).json({ message: 'Invalid JSON in policies field.' });
      }
    }

    // Parse address
    if (req.body.address && typeof req.body.address === 'string') {
      try {
        req.body.address = JSON.parse(req.body.address);
        console.log("Parsed address:", req.body.address);
      } catch (err) {
        console.error("Invalid JSON for address:", err.message);
        return res.status(400).json({ message: 'Invalid JSON in address field.' });
      }
    }

    next();
  } catch (error) {
    console.error('Error parsing store nested JSON fields:', error);
    return res.status(400).json({ message: 'Invalid JSON in request body.' });
  }
};

export default storeParserMiddleware;
