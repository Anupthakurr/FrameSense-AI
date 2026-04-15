import User from "../models/user.model.js";
import UserAvatar from "../models/userAvatar.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const addUserAvatar = async (req, res) => {
    const { id } = req.user;

    try {
        const user = await User.findById(id);
        if (!user) {
            return res.status(401).json({
                error: "User doesn't exist",
            });
        }
        let avatarUrl = "";
        if (req.file) {
            const avatar = await uploadOnCloudinary(req.file.buffer);
            if (avatar && avatar.url) {
                avatarUrl = avatar.url;
            } else {
                return res.status(500).json({ error: "Avatar not uploaded!" });
            }
        } else {
            avatarUrl = "https://api.dicebear.com/7.x/notionists/svg?seed=John?size=64";
        }
        const existedUserAvatar = await UserAvatar.findOne({ userId: id });
        if (!existedUserAvatar) {
            const createdUserAvatar = await UserAvatar.create({
                userId: id,
                avatarUrl,
            });
            if (!createdUserAvatar) {
                return res.status(500).json({
                    error: "Something went wrong while uploading the avatar",
                });
            }
            return res
                .status(201)
                .json(
                    new ApiResponse(201, createdUserAvatar, "Avatar Uploaded!")
                );
        } else {
            existedUserAvatar.avatarUrl = avatarUrl;
            await existedUserAvatar.save();
            return res
                .status(200)
                .json(
                    new ApiResponse(200, existedUserAvatar, "Avatar Updated!")
                );
        }
    } catch (error) {
        return res
            .status(500)
            .json({ error: `Internal Server error: ${error.message}` });
    }
};

const getUserAvatar = async (req, res) => {
    const { id } = req.user;
    const DEFAULT_AVATAR_URL = "https://api.dicebear.com/7.x/notionists/svg?seed=John?size=64";
    try {
        let avatar = await UserAvatar.findOne({ userId: id });
        if (!avatar) {
            avatar = await UserAvatar.create({
                userId: id,
                avatarUrl: DEFAULT_AVATAR_URL,
            });
            return res
                .status(201)
                .json(new ApiResponse(201, avatar, "Default avatar created"));
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, avatar, "Avatar retrieved successfully!")
            );
    } catch (error) {
        return res.status(500).json({
            error: `Internal Server error: ${error.message}`,
        });
    }
};

export { addUserAvatar, getUserAvatar };
