import mongoose from "mongoose";

const clientSchema = new mongoose.Schema(
    {
        userId: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true,
            },
        ],
        name: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
        },
        userAvatar: {
            type: String // cloudinary URL
        }
    },
    { timestamps: true }
);

clientSchema.pre("save", function (next) {
    if (this.name) {
        this.name = this.name
            .split(' ') // Split the name into words
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
            .join(' '); // Join the words back together
    }
    next();
});

export default mongoose.model("Client", clientSchema);
