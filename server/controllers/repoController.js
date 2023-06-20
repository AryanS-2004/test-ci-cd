const asyncHandler = require('express-async-handler');
const User = require("../models/userModels");
const axios = require("axios");

const checkRepoExistence = async (link) => {
    try {
        const config = {
            headers: {
                Authorization: `${process.env.GITHUB_PAT}`
            }
        }
        const response = await axios.get(link, config);
        if (response.status === 200) {
            return true; // Repository exists
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return false; // Repository doesn't exist
        }
        throw error; // Error occurred while checking repository existence
    }
};

const addRepo = asyncHandler(async (req, res) => {
    const link = req.body.link;
    const userId = req.user._id;

    if(!link)return;

    const repoExists = await checkRepoExistence(link);
    if (!repoExists) {
        return res.status(404).send("Give a correct link to the repository");
    }

    const user = await User.findById(userId, "-password");
    if (!user) {
        return res.status(404).send("User doesn't exist");
    }
    // Check if the repository link already exists in the user's repos array
    if (user.repos.includes(link)) {
        return res.status(400).send("Repository already exists in the user's database");
    }

    user.repos.push(link);
    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        repos: updatedUser.repos,
    });
})

const removeRepo = asyncHandler(async (req, res) => {
    const link = req.body.link;
    const userId = req.user._id;

    if (!link) return;

    const repoExists = await checkRepoExistence(link);
    if (!repoExists) {
        return res.status(404).send("Give a correct link to the repository");
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).send("User doesn't exist");
    }

    const repoIndex = user.repos.indexOf(link);
    if (repoIndex === -1) {
        return res.status(404).send("Repository doesn't exist in the user's database");
    }

    user.repos.splice(repoIndex, 1);
    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        repos: updatedUser.repos,
    });
})

module.exports = {addRepo, removeRepo}