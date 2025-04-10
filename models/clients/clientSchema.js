import mongoose from 'mongoose'
import { type } from 'os';

const ClientSchema = new mongoose.Schema(
    {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true
      },
      company: {
        type: String,
      },
      mobile: {
        type: Number,
      },
      agentTask: {
        type: String,
      },
      profileUrl: {
        type: String, 
      },
      isActive: {
        type: Boolean,
        default: true
      },
      additionalInfo:{
        lifeTimeNumberOfcompletedOrders:{
            type:Number,
            default:0
        },
        daysSinceLastOrder:{
            type:Number,
            default:0
        },
        avgSalePriceThisYear:{
            type:Number,
            default:0
        },
        avgSalePriceLastYear:{
            type:Number,
            default:0
        }
      }
    },
    {
      timestamps: true // adds createdAt and updatedAt
    }
  );

export default mongoose.model('Client',ClientSchema) 