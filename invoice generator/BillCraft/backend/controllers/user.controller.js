import User from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
    const { username, fullname, email, password, businessName } = req.body;

    // Check all the necessary fields
    if (!username || !fullname || !email || !password || !businessName) {
        return res.status(400).json({
            error: "All the fields are required",
        });
    }

    try {
        const lowerCaseEmail = email.toLowerCase();

        //check if any users exist in the database
        const existingUsers = await User.countDocuments();

        //Check user already exists or not
        const existedUser = await User.findOne({
            $or: [{ username }, { email: lowerCaseEmail }],
        });

        if (existedUser) {
            return res.status(409).json({
                error: "User already exists",
            });
        }

        // Assign admin role only to the first user
        const isAdmin = existingUsers === 0;

        //Create a fresh entry in the database
        const user = await User.create({
            username,
            fullname,
            email: lowerCaseEmail,
            password,
            businessName,
            isAdmin,
        });

        const createdUser = await User.findById(user._id).select("-password");

        if (!createdUser) {
            return res.status(500).json({
                error: "Something went wrong while registring the user. Pls try again!",
            });
        }

        return res
            .status(201)
            .json(
                new ApiResponse(
                    201,
                    createdUser,
                    "User registered successfully!"
                )
            );
    } catch (error) {
        return res.status(500).json({
            error: `User can't be created. Error: ${error.message}`,
        });
    }
};

const loginUser = async (req, res) => {
    // //identifier can be username or email
    const { identifier, password } = req.body;

    //validate the user
    if (!identifier || !password) {
        return res.status(400).json({
            error: "All the fields are required",
        });
    }

    try {
        //check if user exist or not
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }],
        });

        if (!user) {
            return res.status(409).json({
                error: "Account doesn't exist. Please register.",
            });
        }

        //check for the password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                error: "Incorrect Password",
            });
        }
        //Generate the token
        const token = jwt.sign(
            { id: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        //set the cookies
        const cookieOptions = {
            httpOnly: true, // Prevent client-side JS from accessing the cookie
            secure: process.env.NODE_ENV === "production", // Ensure the cookie is only sent over HTTPS in production
            sameSite: "strict", // Mitigate CSRF attacks
            maxAge: 24 * 60 * 60 * 1000, // Cookie expiration time (1 day)
        };
        res.cookie("token", token, cookieOptions);

        //remove password for response
        const existedUser = await User.findById(user._id).select("-password");

        //return
        return res.status(200).json({
            message: "Login Successful",
            user: existedUser,
        });
    } catch (error) {
        return res.status(500).json({
            error: `Server error, ${error}`,
        });
    }
};

const logoutUser = async (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "Strict",
    });
    return res.status(200).json({
        message: "Logout successful!",
    });
};

const getInfo = async (req, res) => {
    const { id } = req.user;
    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json({
                error: "User doesn't exist!",
            });
        }
        res.status(200).json(
            new ApiResponse(200, user, "User info retrieved successfully!")
        );
    } catch (error) {
        res.status(500).json({
            error: `Internal Server error: ${error.message}`,
        });
    }
};

const loginWithGoogle = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(409).json({
            error: "Account doesn't exist. Please register.",
        });
    }
    try {
        //Generate the token
        const token = jwt.sign(
            { id: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        //set the cookies
        const cookieOptions = {
            httpOnly: true, // Prevent client-side JS from accessing the cookie
            secure: process.env.NODE_ENV === "production", // Ensure the cookie is only sent over HTTPS in production
            sameSite: "strict", // Mitigate CSRF attacks
            maxAge: 24 * 60 * 60 * 1000, // Cookie expiration time (1 day)
        };
        res.cookie("token", token, cookieOptions);

        //remove password for response
        const existedUser = await User.findById(user._id).select("-password");

        //return
        return res.status(200).json({
            message: "Login Successful",
            user: existedUser,
        });
    } catch (error) {
        return res.status(500).json({
            error: `Server error, ${error}`,
        });
    }
};

export { registerUser, loginUser, getInfo, logoutUser, loginWithGoogle };
