import { useState, useEffect } from 'react';
import { attendanceAPI, employeeAPI } from '../api';
import Topbar from '../components/Topbar';
import toast from 'react-hot-toast';

import * as XLSX from 'xlsx';

function exportExcel(records) {
  const data = records.map((r, i) => ({
    '#': i + 1,
    'Employee ID': r.employee_id,
    'Name': r.name || '',
    'Department': r.department || '',
    'Designation': r.designation || '',
    'Date': r.date,
    'Check-In Time': r.time_in || '',
    'Check-Out Time': r.time_out || '',
    'Last Check-Out Time': r.time_out || '',
    'Marked By': r.marked_by || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');
  
  XLSX.writeFile(workbook, `attendance_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  toast.success('Excel exported!');
}

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

function CalendarView({ records, currentMonth, setCurrentMonth, onSelectDate }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }
  
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  
  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  const attendanceMap = {};
  records.forEach(r => {
    attendanceMap[r.date] = (attendanceMap[r.date] || 0) + 1;
  });

  return (
    <div className="card slide-up">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-secondary btn-sm" onClick={prevMonth}>&larr; Prev</button>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{monthName}</div>
        <button className="btn btn-secondary btn-sm" onClick={nextMonth}>Next &rarr;</button>
      </div>
      <div className="card-body" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, textAlign: 'center', marginBottom: 12, fontWeight: 'bold', color: 'var(--text2)', fontSize: 13, textTransform: 'uppercase' }}>
          <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} style={{ minHeight: 80, background: 'var(--surface)', borderRadius: 8, opacity: 0.3 }}></div>;
            
            const dateStr = [
              day.getFullYear(),
              String(day.getMonth() + 1).padStart(2, '0'),
              String(day.getDate()).padStart(2, '0')
            ].join('-');
            
            const count = attendanceMap[dateStr] || 0;
            const isToday = isCurrentMonth && day.getDate() === today.getDate();
            
            return (
              <div 
                key={dateStr} 
                onClick={() => onSelectDate(dateStr)}
                style={{ 
                  minHeight: 80, 
                  background: isToday ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)', 
                  border: isToday ? '2px solid var(--emerald)' : '2px solid transparent',
                  borderRadius: 8, 
                  padding: 8, 
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--surface2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = isToday ? 'var(--emerald)' : 'transparent'; e.currentTarget.style.background = isToday ? 'rgba(16, 185, 129, 0.05)' : 'var(--surface)'; }}
              >
                <div style={{ fontWeight: 600, marginBottom: 8, color: isToday ? 'var(--emerald)' : 'var(--text)' }}>
                  {day.getDate()}
                </div>
                {count > 0 ? (
                  <div className="badge badge-green" style={{ fontSize: 10, padding: '4px 8px', width: '100%', textAlign: 'center', boxSizing: 'border-box' }}>
                    {count} {count === 1 ? 'person' : 'people'}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: 'var(--text3)' }}>No data</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Attendance() {
  const [records,     setRecords]     = useState([]);
  const [employees,   setEmployees]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filterDate,  setFilterDate]  = useState('');
  const [filterEmp,   setFilterEmp]   = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    Promise.all([
      attendanceAPI.getAll(),
      employeeAPI.getAll(),
    ]).then(([a, e]) => {
      setRecords(a.data.data);
      setEmployees(e.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const filteredForCalendar = records.filter(r => {
    if (filterEmp && r.employee_id !== filterEmp) return false;
    return true;
  });

  const filteredForTable = filteredForCalendar.filter(r => {
    if (filterDate && r.date !== filterDate) return false;
    return true;
  });

  const activeRecords = filterDate ? filteredForTable : filteredForCalendar;

  // Stats
  const totalDays = [...new Set(activeRecords.map(r => r.date))].length;

  // Top 5 most present employees
  const presenceCounts = {};
  activeRecords.forEach(r => {
    presenceCounts[r.employee_id] = (presenceCounts[r.employee_id] || 0) + 1;
  });
  const topEmployees = Object.entries(presenceCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => {
      const emp = employees.find(e => e.employee_id === id);
      return { id, count, name: emp?.name || id, dept: emp?.department || '' };
    });
  const maxCount = topEmployees[0]?.count || 1;

  return (
    <>
      <Topbar title="Attendance Log" subtitle="Full attendance history with filters">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => exportExcel(activeRecords)}
          disabled={activeRecords.length === 0}
        >
          ⬇️ Export Excel
        </button>
      </Topbar>

      <div className="page-wrapper fade-in">
        {/* Tab Strip */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          {filterDate ? (
             <button className="btn btn-primary" onClick={() => setFilterDate('')}>
               &larr; Back to Calendar
             </button>
           ) : (
             <div style={{ fontWeight: 'bold', fontSize: 18, color: 'var(--text)' }}>
                Attendance Calendar
             </div>
           )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              className="form-control"
              style={{ width: 'auto', minWidth: 180 }}
              value={filterEmp}
              onChange={e => setFilterEmp(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map(e => (
                <option key={e.employee_id} value={e.employee_id}>
                  {e.name}
                </option>
              ))}
            </select>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => { setFilterDate(''); setFilterEmp(''); setCurrentMonth(new Date()); }}
            >✕ Clear</button>
          </div>
        </div>

        {/* Summary Strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div className="badge badge-green" style={{ padding: '8px 16px', fontSize: 13 }}>
            ✅ {activeRecords.length} records
          </div>
          {totalDays > 0 && (
            <div className="badge badge-cyan" style={{ padding: '8px 16px', fontSize: 13 }}>
               {filterDate ? '📅 Selected Date' : `📅 ${totalDays} working days tracked`}
            </div>
          )}
          <div className="badge badge-purple" style={{ padding: '8px 16px', fontSize: 13 }}>
            👥 {employees.length} total employees
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

          {/* Main Content */}
          <div>
            {loading ? (
              <div className="loading-overlay"><div className="spinner" /></div>
            ) : !filterDate ? (
              <CalendarView 
                records={filteredForCalendar} 
                currentMonth={currentMonth} 
                setCurrentMonth={setCurrentMonth} 
                onSelectDate={setFilterDate} 
              />
            ) : filteredForTable.length === 0 ? (
              <div className="empty-state card" style={{ padding: 60 }}>
                <div className="empty-icon">📭</div>
                <h3>No attendance records</h3>
                <p>No records match your filters for {filterDate}</p>
              </div>
            ) : (
              <div className="table-container slide-up">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Check-In</th>
                      <th>Check-Out</th>
                      <th>Marked By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredForTable.map((record, idx) => (
                      <tr key={record.id} className="slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                        <td style={{ color: 'var(--text3)', fontFamily: 'monospace', fontSize: 12 }}>
                          {idx + 1}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div className="avatar">
                              {record.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                            </div>
                            <div>
                              <div className="primary-text">{record.name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'monospace' }}>
                                {record.employee_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge badge-cyan">{record.department}</span></td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                          {record.date === todayStr ? (
                            <><span className="pulse-dot" />{record.date}</>
                          ) : record.date}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--emerald)', fontWeight: 'bold' }}>
                          {record.time_in}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: 13, color: 'var(--red)', fontWeight: 'bold' }}>
                          {record.time_out || '—'}
                        </td>
                        <td>
                          <span className="badge badge-amber">
                            {record.marked_by === 'QR_SCANNER' ? '📷 QR Scan' : record.marked_by}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top Attendance Widget */}
          {topEmployees.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">🏆 Top Attendance</div>
              </div>
              <div className="card-body" style={{ paddingTop: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {topEmployees.map((emp, i) => (
                    <div key={emp.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: 8,
                            background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#ef4444)' :
                                        i === 1 ? 'linear-gradient(135deg,#94a3b8,#64748b)' :
                                        i === 2 ? 'linear-gradient(135deg,#a16207,#78350f)' :
                                        'var(--surface2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 800, color: '#fff',
                          }}>
                            {i + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{emp.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--text3)' }}>{emp.dept}</div>
                          </div>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-light)' }}>
                          {emp.count}d
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(emp.count / maxCount) * 100}%`,
                          background: i === 0
                            ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                            : 'linear-gradient(90deg, var(--accent), var(--purple))',
                          borderRadius: 2,
                          transition: 'width 1s ease',
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
