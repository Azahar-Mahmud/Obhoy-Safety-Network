const mongoose = require('mongoose');

const incidentReportSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ['mugging', 'harassment', 'checkpost_harassment', 'poor_lighting', 'safe_spot'],
    required: true,
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat] — GeoJSON order
  },
  description: { type: String, default: '' },
  verifiedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Kept hidden for anti-abuse
}, { timestamps: true });

incidentReportSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('IncidentReport', incidentReportSchema);