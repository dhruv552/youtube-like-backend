import mongoose, {Schema} from "mongoose"

const videoSchema = new Schema({
    videoFile:{
        type : String,//video file path
        required : true
    },
    thumbnail:{
        type : String,//thumbnail file path
        required : true
    },
    title:{
        type : String,
        required : true
    },
    discription:{
        type : String,
        required : true
    },
    views:{
        type : Number,
        default : 0
    },
    duration:{
        type : Number,
        required : true
    },
    isPublished:{
        type : Boolean,
        default : false
    },
    owner:{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
    }
    },{timestamps : true}
)
export const Video = mongoose.model("Video", videoSchema)
