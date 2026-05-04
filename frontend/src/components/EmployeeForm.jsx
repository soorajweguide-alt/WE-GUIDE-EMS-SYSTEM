import { useState, useEffect } from 'react';
import { employeeAPI } from '../api';
import toast from 'react-hot-toast';

const FIELDS = [
  { name: 'employee_id',       label: 'Employee ID',             type: 'text',   required: true,  span: 1 },
  { name: 'name',              label: 'Full Name',               type: 'text',   required: true,  span: 1 },
  { name: 'designation',       label: 'Designation',             type: 'text',   required: true,  span: 1 },
  { name: 'department',        label: 'Department',              type: 'select', required: true,  span: 1 },
  { name: 'dob',               label: 'Date of Birth',           type: 'date',   required: true,  span: 1 },
  { name: 'age',               label: 'Age',                     type: 'number', required: true,  span: 1 },
  { name: 'gender',            label: 'Gender',                  type: 'select', required: true,  span: 1 },
  { name: 'blood_group',       label: 'Blood Group',             type: 'select', required: true,  span: 1 },
  { name: 'phone',             label: 'Phone Number',            type: 'tel',    required: true,  span: 1 },
  { name: 'emergency_contact', label: 'Emergency Contact',       type: 'tel',    required: true,  span: 1 },
  { name: 'address',           label: 'Address',                 type: 'textarea', required: true, span: 2 },
  { name: 'profile_url',       label: 'GitHub URL (QR Token)',   type: 'url',      required: false, span: 2, onlyEdit: true },
];

const DEPARTMENTS = [
  'Administration', 'AIML R&D', 'Embedding System R&D', 'Trainers', 'Other'
];
const GENDERS     = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const EMPTY = {
  employee_id: '', name: '', designation: '', department: '',
  dob: '', age: '', gender: '', blood_group: '',
  address: '', phone: '', emergency_contact: '',
};

export default function EmployeeForm({ employee, onSuccess, onCancel }) {
  const [form,    setForm]    = useState(employee ? { ...employee } : { ...EMPTY });
  const [loading, setLoading] = useState(false);
  const [showCustomDept, setShowCustomDept] = useState(
    employee && employee.department && !DEPARTMENTS.includes(employee.department) ? true : false
  );
  const isEdit = !!employee;

  // Auto-calculate age from DOB
  useEffect(() => {
    if (form.dob) {
      const birth = new Date(form.dob);
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
      setForm(f => ({ ...f, age: age > 0 ? age : '' }));
    }
  }, [form.dob]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await employeeAPI.update(employee.employee_id, form);
        toast.success('Employee updated successfully!');
        onSuccess?.();
      } else {
        const res = await employeeAPI.create(form);
        toast.success('Employee added successfully!');
        setForm({ ...EMPTY });
        onSuccess?.(res.data.data);   // pass created employee to caller
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    if (field.type === 'select') {
      const options = field.name === 'department' ? DEPARTMENTS
                    : field.name === 'gender'     ? GENDERS
                    : BLOOD_GROUPS;

      if (field.name === 'department') {
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }}>
            <select
              id={field.name}
              name={field.name}
              className="form-control"
              value={showCustomDept ? 'Other' : form.department}
              onChange={(e) => {
                if (e.target.value === 'Other') {
                  setShowCustomDept(true);
                  setForm(f => ({ ...f, department: '' }));
                } else {
                  setShowCustomDept(false);
                  handleChange(e);
                }
              }}
              required={field.required && !showCustomDept}
            >
              <option value="">Select {field.label}</option>
              {options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
            {showCustomDept && (
              <input
                type="text"
                name="department"
                className="form-control"
                placeholder="Enter new department"
                value={form.department}
                onChange={handleChange}
                required
                autoFocus
              />
            )}
          </div>
        );
      }

      return (
        <select
          id={field.name}
          name={field.name}
          className="form-control"
          value={form[field.name]}
          onChange={handleChange}
          required={field.required}
        >
          <option value="">Select {field.label}</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          id={field.name}
          name={field.name}
          className="form-control"
          value={form[field.name]}
          onChange={handleChange}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          required={field.required}
        />
      );
    }

    return (
      <input
        id={field.name}
        type={field.type}
        name={field.name}
        className="form-control"
        value={form[field.name]}
        onChange={handleChange}
        placeholder={`Enter ${field.label.toLowerCase()}`}
        required={field.required}
        readOnly={isEdit && field.name === 'employee_id'}
        style={isEdit && field.name === 'employee_id' ? { opacity: .6, cursor: 'not-allowed' } : {}}
      />
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-grid">
        {FIELDS.filter(f => !f.onlyEdit || isEdit).map(field => (
          <div
            key={field.name}
            className="form-group"
            style={field.span === 2 ? { gridColumn: 'span 2' } : {}}
          >
            <label htmlFor={field.name} className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {renderField(field)}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 28, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading
            ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Saving…</>
            : <>{isEdit ? '💾 Save Changes' : '✨ Add Employee'}</>}
        </button>
      </div>
    </form>
  );
}
