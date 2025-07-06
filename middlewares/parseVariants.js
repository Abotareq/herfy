export const parseVariantsMiddleware = (req, res, next) => {
  if (req.body.variants) {
    try {
        console.log("hi")
      req.body.variants = JSON.parse(req.body.variants);
    } catch (err) {
      return res.status(400).json({ message: "Invalid variants JSON format" });
    }
  }
  next();
};