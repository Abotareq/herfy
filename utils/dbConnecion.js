import mongoose from "mongoose";
export const connecToDb = () => {
  mongoose
    .connect(`${process.env.DB_HOST}${process.env.DB_NAME}`)
    .then(() => {
      console.log("MongoDB connected");
    })
    .catch((err) => {
      console.log("MongoDB connection error", err);
    });
};
export const closeDbConnection = () => {
  mongoose.connection
    .close()
    .then(() => {
      console.log("MongoDB connection closed");
    })
    .catch((err) => {
      console.log("MongoDB connection close error", err);
    });
};
