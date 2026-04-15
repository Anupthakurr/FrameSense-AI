import jwt from "jsonwebtoken";

const authenticate = (req, res, next) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            error: "No token provided, Unauthorised!",
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            error: "Invalid token, Unauthorised!",
        });
    }
};

export { authenticate };
