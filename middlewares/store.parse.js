const storeParserMiddleware = (req, res, next) => {
    console.log("hi");
  try {
    // Parse location if sent as JSON string in form-data
    if (req.body.location && typeof req.body.location === 'string') {
      req.body.location = JSON.parse(req.body.location);
    }
    if(req.body.location && req.body.location.coordinates  && req.user.role === "ADMIN") {
      req.body.location.coordinates = JSON.parse(req.body.location.coordinates);
      console.log("Parsed location coordinates:", req.body.location.coordinates);
    }
    // Parse policies if sent as JSON string in form-data
    if (req.body.policies && typeof req.body.policies === 'string') {
      req.body.policies = JSON.parse(req.body.policies);
    }

    if (req.body.address && typeof req.body.address === 'string') {
      req.body.address = JSON.parse(req.body.address);
    }
    next();
  } catch (error) {
    console.error('Error parsing store nested JSON fields:', error);
    return res.status(400).json({ message: 'Invalid JSON in location or policies field.' });
  }
};

export default storeParserMiddleware;
