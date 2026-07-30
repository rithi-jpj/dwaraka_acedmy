const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('Fee', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  student_id: { type: DataTypes.UUID, allowNull: false },
  batch_id: { type: DataTypes.UUID, allowNull: true },
  // Fee structure fields
  fee_head: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Tuition Fee' },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  due_date: { type: DataTypes.DATEONLY, allowNull: false },
  // Payment tracking
  paid_amount: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: {
    type: DataTypes.ENUM('pending', 'partial', 'paid', 'waived'),
    defaultValue: 'pending',
  },
  payment_date: { type: DataTypes.DATEONLY },
  payment_mode: {
    type: DataTypes.ENUM('cash', 'card', 'online', 'bank_transfer', 'cheque'),
    allowNull: true,
  },
  transaction_id: { type: DataTypes.STRING },
  invoice_no: { type: DataTypes.STRING, unique: true },
  remarks: { type: DataTypes.TEXT },
  // Term/installment tracking
  term: { type: DataTypes.STRING, comment: 'e.g. Term 1, Term 2, Annual' },
  academic_year: { type: DataTypes.STRING, defaultValue: () => {
    const y = new Date().getFullYear();
    return `${y}-${y + 1}`;
  }},
  // Audit
  created_by: { type: DataTypes.UUID, allowNull: false },
  updated_by: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'fees',
  timestamps: true,
  indexes: [
    { fields: ['student_id'] },
    { fields: ['batch_id'] },
    { fields: ['status'] },
    { fields: ['invoice_no'] },
    { fields: ['due_date'] },
    { fields: ['academic_year'] },
  ],
});
