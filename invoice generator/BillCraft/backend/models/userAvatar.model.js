import mongoose from "mongoose";

const userAvatarSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            requred: true,
            unique: true,
        },
        avatarUrl: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("UserAvatar", userAvatarSchema);
