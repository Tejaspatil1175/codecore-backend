const mongoose = require('mongoose');

const purchaseRequestSchema = new mongoose.Schema({
      room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: true
      },
      unlockCode: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UnlockCode',
            required: true
      },
      seller: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
      },
      buyer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
      },
      offeredPrice: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative']
      },
      status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected'],
            default: 'pending'
      },
      createdAt: {
            type: Date,
            default: Date.now
      }
}, {
      timestamps: true
});

purchaseRequestSchema.index({ room: 1, seller: 1 });
purchaseRequestSchema.index({ room: 1, buyer: 1 });
purchaseRequestSchema.index({ unlockCode: 1 });

module.exports = mongoose.model('PurchaseRequest', purchaseRequestSchema);
