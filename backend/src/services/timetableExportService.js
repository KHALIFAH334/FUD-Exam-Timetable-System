const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// ==========================================================
// COLOURS
// ==========================================================

const FUD_GREEN = '006B36';
const FUD_ORANGE = 'C45A00';
const PERIOD_GREEN = '006B36';
const BORDER_COLOR = 'B7B7B7';
const DATE_BACKGROUND = 'FFF2CC';
const WHITE = 'FFFFFF';
const BLACK = '000000';

// ==========================================================
// FUD LOGO PATH
// ==========================================================

// USE THE SAME LOGO AS THE FRONTEND
// Project:
// FUD-Exam-Timetable-System
//
// Backend service:
// backend/src/services/timetableExportService.js
//
// Frontend logo:
// frontend/public/fud-logo.png

const LOGO_PATH = path.resolve(
    __dirname,
    '../../../frontend/public/fud-logo.png'
);

const LOGO_PATHS = [
    LOGO_PATH
];

console.log('==================================================');
console.log('FUD LOGO PATH:');
console.log(LOGO_PATH);
console.log('LOGO EXISTS:', fs.existsSync(LOGO_PATH));
console.log('==================================================');
// ==========================================================
// IMAGE VALIDATION
// ==========================================================

const getImageExtension = (buffer) => {

    if (!Buffer.isBuffer(buffer)) {
        return null;
    }

    // PNG
    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4E &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0D &&
        buffer[5] === 0x0A &&
        buffer[6] === 0x1A &&
        buffer[7] === 0x0A
    ) {
        return 'png';
    }

    // JPEG
    if (
        buffer.length >= 3 &&
        buffer[0] === 0xFF &&
        buffer[1] === 0xD8 &&
        buffer[2] === 0xFF
    ) {
        return 'jpeg';
    }

    return null;
};


// ==========================================================
// FIND VALID LOGO
// ==========================================================

const getValidLogo = () => {

    for (const logoPath of LOGO_PATHS) {

        try {

            if (!fs.existsSync(logoPath)) {
                continue;
            }

            const buffer =
                fs.readFileSync(logoPath);

            const extension =
                getImageExtension(buffer);

            if (!extension) {
                console.warn(
                    `Logo found but unsupported image format: ${logoPath}`
                );

                continue;
            }

            console.log(
                `Timetable export logo loaded: ${logoPath}`
            );

            return {
                path: logoPath,
                buffer,
                extension
            };

        } catch (error) {

            console.warn(
                `Unable to read logo ${logoPath}:`,
                error.message
            );
        }
    }

    console.warn(
        'No valid PNG/JPEG FUD logo could be found.'
    );

    return null;
};


// ==========================================================
// SAFE STRING
// ==========================================================

const safeString = (value) => {

    if (
        value === undefined ||
        value === null
    ) {
        return '';
    }

    return String(value).trim();
};


// ==========================================================
// DATE HELPERS
// ==========================================================

const getDateObject = (value) => {

    if (!value) {
        return new Date(0);
    }

    if (value instanceof Date) {
        return value;
    }

    const text =
        safeString(value);

    const clean =
        text.slice(0, 10);

    const parsed =
        new Date(
            `${clean}T00:00:00`
        );

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return new Date(0);
    }

    return parsed;
};


const formatLongDate = (value) => {

    if (!value) {
        return '';
    }

    const parsed =
        getDateObject(value);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return safeString(value);
    }

    return parsed.toLocaleDateString(
        'en-GB',
        {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }
    );
};


const formatShortDate = (value) => {

    if (!value) {
        return '';
    }

    const parsed =
        getDateObject(value);

    if (
        Number.isNaN(
            parsed.getTime()
        )
    ) {
        return safeString(value);
    }

    return parsed.toLocaleDateString(
        'en-GB',
        {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }
    );
};


// ==========================================================
// FACULTY / SESSION HELPERS
// ==========================================================

const getFacultyName = (timetable) => {

    return safeString(
        timetable.faculty_name ||
        timetable.facultyName ||
        timetable.faculty?.name ||
        timetable.faculty?.faculty_name ||
        'Faculty of Computing'
    );
};


const getFacultyCode = (timetable) => {

    return safeString(
        timetable.faculty_code ||
        timetable.facultyCode ||
        timetable.faculty?.code ||
        ''
    );
};


const getSessionName = (timetable) => {

    return safeString(
        timetable.session_name ||
        timetable.sessionName ||
        timetable.academic_session ||
        timetable.academicSession ||
        ''
    );
};


const getSemester = (timetable) => {

    return safeString(
        timetable.semester ||
        timetable.term ||
        ''
    );
};


const getVersion = (timetable) => {

    return (
        timetable.version_number ??
        timetable.version ??
        1
    );
};


const getStatus = (timetable) => {

    return safeString(
        timetable.status ||
        'draft'
    ).toLowerCase();
};


// ==========================================================
// HEADER TEXT
// ==========================================================

const getAcademicSessionText = (timetable) => {

    const semester =
        getSemester(timetable);

    const session =
        getSessionName(timetable);

    if (
        semester &&
        session
    ) {
        return `${semester.toUpperCase()} ${session} ACADEMIC SESSION`;
    }

    if (session) {
        return `${session.toUpperCase()} ACADEMIC SESSION`;
    }

    return 'ACADEMIC SESSION';
};


const getVersionText = (timetable) => {

    const session =
        getSessionName(timetable);

    const semester =
        getSemester(timetable);

    const version =
        getVersion(timetable);

    const parts = [];

    if (session) {
        parts.push(session);
    }

    if (semester) {
        parts.push(semester);
    }

    if (parts.length) {
        return `${parts.join(' — ')} | Version ${version}`;
    }

    return `Version ${version}`;
};


const getStatusText = (timetable) => {

    const status =
        getStatus(timetable);

    if (status === 'published') {
        return 'PUBLISHED';
    }

    if (status === 'archived') {
        return 'ARCHIVED';
    }

    return `DRAFT / VERSION ${getVersion(timetable)}`;
};


// ==========================================================
// PERIODS
// ==========================================================

const PERIODS = {

    morning: {
        title: 'MORNING',
        time: '7:30 - 10:30 AM'
    },

    afternoon: {
        title: 'AFTERNOON',
        time: '11:00 AM - 2:00 PM'
    },

    evening: {
        title: 'EVENING',
        time: '3:00 - 6:00 PM'
    }

};


// ==========================================================
// PERIOD DETECTION
// ==========================================================

const getPeriod = (entry) => {

    const label =
        safeString(
            entry.slot_label ||
            entry.time_slot_label ||
            entry.period ||
            entry.slot ||
            ''
        ).toLowerCase();


    // Explicit period names have priority.

    if (
        label.includes('morning')
    ) {
        return 'morning';
    }

    if (
        label.includes('afternoon')
    ) {
        return 'afternoon';
    }

    if (
        label.includes('evening')
    ) {
        return 'evening';
    }


    // Look for explicit clock times.

    if (
        label.includes('7:30') ||
        label.includes('07:30') ||
        label.includes('8:00') ||
        label.includes('08:00') ||
        label.includes('9:00') ||
        label.includes('09:00') ||
        label.includes('10:00') ||
        label.includes('10:30')
    ) {
        return 'morning';
    }


    if (
        label.includes('11:00') ||
        label.includes('11:30') ||
        label.includes('12:00') ||
        label.includes('12:30') ||
        label.includes('1:00') ||
        label.includes('01:00') ||
        label.includes('1:30') ||
        label.includes('01:30') ||
        label.includes('2:00') ||
        label.includes('02:00')
    ) {
        return 'afternoon';
    }


    if (
        label.includes('3:00') ||
        label.includes('03:00') ||
        label.includes('3:30') ||
        label.includes('03:30') ||
        label.includes('4:00') ||
        label.includes('04:00') ||
        label.includes('5:00') ||
        label.includes('05:00') ||
        label.includes('6:00') ||
        label.includes('06:00')
    ) {
        return 'evening';
    }


    // Fallback to start_time.

    const start =
        safeString(
            entry.start_time ||
            entry.startTime ||
            ''
        );


    if (start) {

        const match =
            start.match(
                /(\d{1,2})(?::(\d{2}))?/
            );

        if (match) {

            let hour =
                Number(match[1]);

            const lower =
                start.toLowerCase();

            if (
                lower.includes('pm') &&
                hour < 12
            ) {
                hour += 12;
            }

            if (
                lower.includes('am') &&
                hour === 12
            ) {
                hour = 0;
            }

            if (hour < 11) {
                return 'morning';
            }

            if (hour < 15) {
                return 'afternoon';
            }

            return 'evening';
        }
    }


    // Safe default.

    return 'morning';
};


// ==========================================================
// VENUE
// ==========================================================

const getVenues = (entry) => {

    const allocation =
        entry?.venue_allocation ||
        entry?.venueAllocation ||
        {};

    if (
        Array.isArray(
            allocation.venues
        )
    ) {
        return allocation.venues;
    }

    if (
        Array.isArray(
            entry?.venues
        )
    ) {
        return entry.venues;
    }

    return [];
};


const getVenueText = (entry) => {

    const venues =
        getVenues(entry);

    if (!venues.length) {
        return 'Not assigned';
    }

    const names =
        venues
            .map((venue) => {

                const name =
                    safeString(
                        venue?.venue_name ||
                        venue?.name ||
                        venue?.venueName ||
                        ''
                    );

                const code =
                    safeString(
                        venue?.venue_code ||
                        venue?.code ||
                        venue?.venueCode ||
                        ''
                    );

                if (
                    name &&
                    code &&
                    name.toLowerCase() !==
                        code.toLowerCase()
                ) {
                    return `${name} (${code})`;
                }

                return name || code || 'Venue';

            })
            .filter(Boolean);

    return names.length
        ? names.join(', ')
        : 'Not assigned';
};


// ==========================================================
// INVIGILATORS
// ==========================================================

const getInvigilators = (entry) => {

    const allocation =
        entry?.invigilator_allocation ||
        entry?.invigilatorAllocation ||
        {};

    if (
        Array.isArray(
            allocation.invigilators
        )
    ) {
        return allocation.invigilators;
    }

    return [];
};


const getInvigilatorText = (entry) => {

    const invigilators =
        getInvigilators(entry);

    if (!invigilators.length) {
        return 'Not assigned';
    }

    return invigilators
        .map((item) => {

            const name =
                safeString(
                    item?.full_name ||
                    item?.name ||
                    ''
                );

            const staffId =
                safeString(
                    item?.staff_id ||
                    item?.staffId ||
                    ''
                );

            if (
                name &&
                staffId
            ) {
                return `${name} (${staffId})`;
            }

            return name || staffId || 'Invigilator';

        })
        .join(', ');
};


// ==========================================================
// COURSE
// ==========================================================

const getCourseShortText = (entry) => {

    const code =
        safeString(
            entry.course_code ||
            entry.courseCode ||
            ''
        );

    const title =
        safeString(
            entry.course_title ||
            entry.courseTitle ||
            ''
        );

    const department =
        safeString(
            entry.department_name ||
            entry.departmentName ||
            entry.department?.name ||
            ''
        );

    const level =
        safeString(
            entry.level ||
            ''
        );

    const candidates =
        entry.candidate_count ??
        entry.candidateCount ??
        entry.candidates ??
        null;


    const lines = [];

    if (
        code &&
        title
    ) {
        lines.push(
            `${code} - ${title}`
        );
    } else if (code) {
        lines.push(code);
    } else if (title) {
        lines.push(title);
    }


    if (department) {
        lines.push(department);
    }


    if (level) {

        let levelText =
            `Level ${level}`;

        if (
            candidates !== null &&
            candidates !== undefined &&
            safeString(candidates)
        ) {
            levelText +=
                ` (${candidates})`;
        }

        lines.push(levelText);

    } else if (
        candidates !== null &&
        candidates !== undefined &&
        safeString(candidates)
    ) {

        lines.push(
            `Candidates: ${candidates}`
        );
    }


    return lines.length
        ? lines.join('\n')
        : 'Not assigned';
};


// ==========================================================
// DATE GROUPING
// ==========================================================

const groupEntriesByDate = (entries) => {

    const groups =
        new Map();


    for (const entry of entries) {

        if (!entry) {
            continue;
        }

        const dateValue =
            entry.exam_date ||
            entry.examDate ||
            entry.date ||
            '';


        const dateKey =
            safeString(dateValue)
                .slice(0, 10);


        if (!groups.has(dateKey)) {

            groups.set(
                dateKey,
                {
                    date: dateValue,
                    morning: [],
                    afternoon: [],
                    evening: []
                }
            );
        }


        const group =
            groups.get(dateKey);


        const period =
            getPeriod(entry);


        group[period].push(entry);
    }


    return Array
        .from(groups.values())
        .sort(
            (a, b) =>
                getDateObject(a.date) -
                getDateObject(b.date)
        );
};


// ==========================================================
// FOOTER INFORMATION
// ==========================================================

const getFooterValue = (
    timetable,
    keys,
    fallback = ''
) => {

    for (const key of keys) {

        const value =
            timetable[key];

        if (
            value !== undefined &&
            value !== null &&
            safeString(value)
        ) {
            return safeString(value);
        }
    }

    return fallback;
};


const getChiefExaminer = (timetable) => {

    return getFooterValue(
        timetable,
        [
            'chief_examiner',
            'chiefExaminer',
            'chief_examiner_name'
        ]
    );
};


const getFacultyExamOfficer = (timetable) => {

    return getFooterValue(
        timetable,
        [
            'faculty_exam_officer',
            'facultyExamOfficer',
            'exam_officer_name'
        ]
    );
};


const getStudentNote = (timetable) => {

    return getFooterValue(
        timetable,
        [
            'student_note',
            'studentNote',
            'exam_note',
            'examNote'
        ],
        'All students are expected to be at their venue at least 30 minutes before the commencement of examinations.'
    );
};


// ==========================================================
// EXCEL BORDER
// ==========================================================

const excelBorder = () => {

    return {
        top: {
            style: 'thin',
            color: {
                argb: BORDER_COLOR
            }
        },

        bottom: {
            style: 'thin',
            color: {
                argb: BORDER_COLOR
            }
        },

        left: {
            style: 'thin',
            color: {
                argb: BORDER_COLOR
            }
        },

        right: {
            style: 'thin',
            color: {
                argb: BORDER_COLOR
            }
        }
    };
};


// ==========================================================
// EXCEL EXPORT
// ==========================================================

const generateTimetableExcel = async (
    timetableData
) => {

    if (
        !timetableData ||
        !timetableData.timetable
    ) {
        throw new Error(
            'Invalid timetable data'
        );
    }


    const timetable =
        timetableData.timetable;


    const entries =
        Array.isArray(
            timetableData.entries
        )
            ? timetableData.entries
            : [];


    const workbook =
        new ExcelJS.Workbook();


    workbook.creator =
        'Federal University Dutse Examination Timetable System';

    workbook.created =
        new Date();

    workbook.modified =
        new Date();


    const worksheet =
        workbook.addWorksheet(
            'Examination Timetable'
        );


    // ======================================================
    // COLUMN WIDTHS
    // ======================================================

    worksheet.columns = [

        {
            width: 17
        },

        {
            width: 37
        },

        {
            width: 25
        },

        {
            width: 37
        },

        {
            width: 25
        },

        {
            width: 37
        },

        {
            width: 25
        }

    ];


    // ======================================================
    // LOGO
    // ======================================================

    const logo = getValidLogo();

if (logo && logo.buffer) {

    try {

        const imageId =
            workbook.addImage({
                buffer: logo.buffer,
                extension: logo.extension
            });

        worksheet.addImage(
            imageId,
            {
                tl: {
                    col: 3.05,
                    row: 0.05
                },
                ext: {
                    width: 70,
                    height: 70
                }
            }
        );

        console.log(
            'FUD logo inserted into Excel successfully.'
        );

    } catch (error) {

        console.error(
            'Excel FUD logo insertion failed:',
            error.message
        );
    }
}


    // ======================================================
    // HEADER
    // ======================================================

    worksheet.mergeCells(
        'A1:G1'
    );

    worksheet.getCell(
        'A1'
    ).value =
        'FEDERAL UNIVERSITY DUTSE';

    worksheet.getCell(
        'A1'
    ).font = {
        bold: true,
        size: 18
    };

    worksheet.getCell(
        'A1'
    ).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    worksheet.getRow(1).height =
        30;


    worksheet.mergeCells(
        'A2:G2'
    );

    worksheet.getCell(
        'A2'
    ).value =
        getFacultyName(timetable);

    worksheet.getCell(
        'A2'
    ).font = {
        bold: true,
        size: 14
    };

    worksheet.getCell(
        'A2'
    ).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    worksheet.getRow(2).height =
        24;


    worksheet.mergeCells(
        'A3:G3'
    );

    worksheet.getCell(
        'A3'
    ).value =
        'EXAMINATION TIME-TABLE';

    worksheet.getCell(
        'A3'
    ).font = {
        bold: true,
        size: 15
    };

    worksheet.getCell(
        'A3'
    ).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    worksheet.getRow(3).height =
        25;


    worksheet.mergeCells(
        'A4:G4'
    );

    worksheet.getCell(
        'A4'
    ).value =
        getAcademicSessionText(
            timetable
        );

    worksheet.getCell(
        'A4'
    ).font = {
        bold: true,
        size: 12
    };

    worksheet.getCell(
        'A4'
    ).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };

    worksheet.getRow(4).height =
        22;


    // ======================================================
    // VERSION + STATUS
    // ======================================================

    worksheet.mergeCells(
        'A5:E5'
    );

    worksheet.getCell(
        'A5'
    ).value =
        getVersionText(
            timetable
        );

    worksheet.getCell(
        'A5'
    ).font = {
        bold: true,
        size: 10,
        color: {
            argb: FUD_ORANGE
        }
    };

    worksheet.getCell(
        'A5'
    ).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };


    worksheet.mergeCells(
        'F5:G5'
    );

    worksheet.getCell(
        'F5'
    ).value =
        getStatusText(
            timetable
        );

    worksheet.getCell(
        'F5'
    ).font = {
        bold: true,
        size: 10,
        color: {
            argb: FUD_ORANGE
        }
    };

    worksheet.getCell(
        'F5'
    ).alignment = {
        horizontal: 'right',
        vertical: 'middle'
    };


    worksheet.getRow(5).height =
        22;


    // ======================================================
    // PERIOD HEADER
    // ======================================================

    worksheet.mergeCells(
        'B7:C7'
    );

    worksheet.mergeCells(
        'D7:E7'
    );

    worksheet.mergeCells(
        'F7:G7'
    );


    worksheet.getCell(
        'A7'
    ).value =
        'DAYS';


    worksheet.getCell(
        'B7'
    ).value =
        `MORNING\n${PERIODS.morning.time}`;


    worksheet.getCell(
        'D7'
    ).value =
        `AFTERNOON\n${PERIODS.afternoon.time}`;


    worksheet.getCell(
        'F7'
    ).value =
        `EVENING\n${PERIODS.evening.time}`;


    const periodHeaderCells = [
        'A7',
        'B7',
        'D7',
        'F7'
    ];


    periodHeaderCells.forEach(
        (cellAddress) => {

            const cell =
                worksheet.getCell(
                    cellAddress
                );


            cell.font = {
                bold: true,
                size: 10,
                color: {
                    argb: WHITE
                }
            };


            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: PERIOD_GREEN
                }
            };


            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true
            };


            cell.border =
                excelBorder();
        }
    );


    worksheet.getRow(7).height =
        34;


    // Apply green to merged cells.

    [
        'B7',
        'C7',
        'D7',
        'E7',
        'F7',
        'G7'
    ].forEach(
        (address) => {

            worksheet.getCell(
                address
            ).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: PERIOD_GREEN
                }
            };

            worksheet.getCell(
                address
            ).border =
                excelBorder();
        }
    );


    // ======================================================
    // SECOND HEADER
    // ======================================================

    const headerRow =
        worksheet.getRow(8);


    headerRow.values = [
        'DAYS',
        'COURSE',
        'VENUE',
        'COURSE',
        'VENUE',
        'COURSE',
        'VENUE'
    ];


    headerRow.height =
        24;


    headerRow.eachCell(
        (cell) => {

            cell.font = {
                bold: true,
                size: 10,
                color: {
                    argb: WHITE
                }
            };


            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {
                    argb: FUD_ORANGE
                }
            };


            cell.alignment = {
                horizontal: 'center',
                vertical: 'middle',
                wrapText: true
            };


            cell.border =
                excelBorder();
        }
    );


    // ======================================================
    // DATA
    // ======================================================

    const grouped =
        groupEntriesByDate(
            entries
        );


    let rowNumber =
        9;


    for (
        const group of grouped
    ) {

        const maxEntries =
            Math.max(
                group.morning.length,
                group.afternoon.length,
                group.evening.length,
                1
            );


        for (
            let index = 0;
            index < maxEntries;
            index++
        ) {

            const morning =
                group.morning[index];

            const afternoon =
                group.afternoon[index];

            const evening =
                group.evening[index];


            const row =
                worksheet.getRow(
                    rowNumber
                );


            row.values = [

                index === 0
                    ? formatLongDate(
                        group.date
                    )
                    : '',

                morning
                    ? getCourseShortText(
                        morning
                    )
                    : '',

                morning
                    ? getVenueText(
                        morning
                    )
                    : '',

                afternoon
                    ? getCourseShortText(
                        afternoon
                    )
                    : '',

                afternoon
                    ? getVenueText(
                        afternoon
                    )
                    : '',

                evening
                    ? getCourseShortText(
                        evening
                    )
                    : '',

                evening
                    ? getVenueText(
                        evening
                    )
                    : ''

            ];


            row.height =
                maxEntries > 1
                    ? 55
                    : 50;


            row.eachCell(
                (
                    cell,
                    columnNumber
                ) => {

                    cell.alignment = {

                        horizontal:
                            columnNumber === 1
                                ? 'center'
                                : 'left',

                        vertical:
                            'middle',

                        wrapText:
                            true
                    };


                    cell.border =
                        excelBorder();


                    cell.font = {
                        name: 'Arial',
                        size:
                            columnNumber === 1
                                ? 10
                                : 9
                    };


                    if (
                        columnNumber === 1
                    ) {

                        cell.font = {
                            name: 'Arial',
                            bold: true,
                            size: 10
                        };


                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: {
                                argb:
                                    DATE_BACKGROUND
                            }
                        };
                    }
                }
            );


            rowNumber++;
        }
    }


    // ======================================================
    // NOTE
    // ======================================================

    rowNumber += 1;


    worksheet.mergeCells(
        `A${rowNumber}:G${rowNumber}`
    );


    worksheet.getCell(
        `A${rowNumber}`
    ).value =
        `NOTE: ${getStudentNote(timetable)}`;


    worksheet.getCell(
        `A${rowNumber}`
    ).font = {
        bold: true,
        size: 9
    };


    worksheet.getCell(
        `A${rowNumber}`
    ).alignment = {
        horizontal: 'left',
        vertical: 'middle',
        wrapText: true
    };


    worksheet.getRow(
        rowNumber
    ).height = 32;


    // ======================================================
    // FOOTER BRAND
    // ======================================================

    rowNumber += 2;


    worksheet.mergeCells(
        `A${rowNumber}:G${rowNumber}`
    );


    worksheet.getCell(
        `A${rowNumber}`
    ).value =
        'Federal University Dutse Examination Timetable System';


    worksheet.getCell(
        `A${rowNumber}`
    ).font = {
        italic: true,
        size: 9,
        color: {
            argb: FUD_GREEN
        }
    };


    worksheet.getCell(
        `A${rowNumber}`
    ).alignment = {
        horizontal: 'center',
        vertical: 'middle'
    };


    // ======================================================
    // EXCEL PAGE SETTINGS
    // ======================================================

    worksheet.views = [
        {
            state: 'frozen',
            ySplit: 8
        }
    ];


    worksheet.pageSetup = {

        orientation:
            'landscape',

        paperSize:
            worksheet.PAPERSIZE_A4,

        fitToPage:
            true,

        fitToWidth:
            1,

        fitToHeight:
            0,

        horizontalDpi:
            300,

        verticalDpi:
            300,

        printArea:
            `A1:G${rowNumber}`
    };


    worksheet.pageMargins = {

        left: 0.25,
        right: 0.25,
        top: 0.25,
        bottom: 0.35,
        header: 0.1,
        footer: 0.1
    };


    worksheet.printOptions = {
        horizontalCentered: true,
        verticalCentered: false
    };


    worksheet.headerFooter.oddFooter =
        '&C Federal University Dutse Examination Timetable System';


    return workbook.xlsx.writeBuffer();
};


// ==========================================================
// PDF TEXT HELPER
// ==========================================================

const pdfText = (
    doc,
    text,
    x,
    y,
    width,
    options = {}
) => {

    doc.text(
        safeString(text),
        x,
        y,
        {
            width,
            ...options
        }
    );
};


// ==========================================================
// PDF HEADER
// ==========================================================

const drawPdfHeader = (
    doc,
    timetable,
    logo
) => {

    const pageWidth =
        841.89;


    const headerCenter =
        pageWidth / 2;


    // ------------------------------------------------------
    // LOGO
    // ------------------------------------------------------

    if (logo) {

        try {

            doc.image(
                logo.buffer,
                headerCenter - 30,
                18,
                {
                    fit: [
                        60,
                        48
                    ],
                    align: 'center',
                    valign: 'center'
                }
            );

        } catch (error) {

            console.warn(
                'PDF logo could not be embedded:',
                error.message
            );
        }
    }


    // ------------------------------------------------------
    // UNIVERSITY
    // ------------------------------------------------------

    doc
        .font(
            'Helvetica-Bold'
        )
        .fontSize(18)
        .fillColor(
            `#${BLACK}`
        );


    pdfText(
        doc,
        'FEDERAL UNIVERSITY DUTSE',
        100,
        72,
        642,
        {
            align: 'center'
        }
    );


    // ------------------------------------------------------
    // FACULTY
    // ------------------------------------------------------

    doc
        .fontSize(14);


    pdfText(
        doc,
        getFacultyName(timetable),
        100,
        95,
        642,
        {
            align: 'center'
        }
    );


    // ------------------------------------------------------
    // TITLE
    // ------------------------------------------------------

    doc
        .fontSize(15);


    pdfText(
        doc,
        'EXAMINATION TIME-TABLE',
        100,
        117,
        642,
        {
            align: 'center'
        }
    );


    // ------------------------------------------------------
    // SESSION
    // ------------------------------------------------------

    doc
        .fontSize(11);


    pdfText(
        doc,
        getAcademicSessionText(
            timetable
        ),
        100,
        139,
        642,
        {
            align: 'center'
        }
    );


    // ------------------------------------------------------
    // VERSION
    // ------------------------------------------------------

    doc
        .fontSize(9)
        .fillColor(
            `#${FUD_ORANGE}`
        );


    pdfText(
        doc,
        getVersionText(
            timetable
        ),
        130,
        163,
        450,
        {
            align: 'center'
        }
    );


    // ------------------------------------------------------
    // STATUS
    // ------------------------------------------------------

    pdfText(
        doc,
        getStatusText(
            timetable
        ),
        640,
        163,
        170,
        {
            align: 'right'
        }
    );


    doc.fillColor(
        `#${BLACK}`
    );
};


// ==========================================================
// PDF TABLE HEADER
// ==========================================================

const drawPdfTableHeader = (
    doc,
    startX,
    startY,
    columns
) => {

    let y =
        startY;


    const tableWidth =
        columns.reduce(
            (
                total,
                column
            ) =>
                total +
                column.width,
            0
        );


    // ------------------------------------------------------
    // GREEN PERIOD HEADER
    // ------------------------------------------------------

    const periodHeight =
        38;


    doc
        .rect(
            startX,
            y,
            tableWidth,
            periodHeight
        )
        .fill(
            `#${PERIOD_GREEN}`
        );


    const periods = [

        {
            label: 'DAYS',
            start: 0,
            span: 1
        },

        {
            label:
                `MORNING\n${PERIODS.morning.time}`,
            start: 1,
            span: 2
        },

        {
            label:
                `AFTERNOON\n${PERIODS.afternoon.time}`,
            start: 3,
            span: 2
        },

        {
            label:
                `EVENING\n${PERIODS.evening.time}`,
            start: 5,
            span: 2
        }

    ];


    periods.forEach(
        (period) => {

            const width =
                columns
                    .slice(
                        period.start,
                        period.start +
                            period.span
                    )
                    .reduce(
                        (
                            total,
                            column
                        ) =>
                            total +
                            column.width,
                        0
                    );


            const x =
                startX +
                columns
                    .slice(
                        0,
                        period.start
                    )
                    .reduce(
                        (
                            total,
                            column
                        ) =>
                            total +
                            column.width,
                        0
                    );


            doc
                .font(
                    'Helvetica-Bold'
                )
                .fontSize(7)
                .fillColor(
                    `#${WHITE}`
                );


            pdfText(
                doc,
                period.label,
                x + 3,
                y + 7,
                width - 6,
                {
                    align: 'center',
                    lineGap: 1
                }
            );
        }
    );


    y += periodHeight;


    // ------------------------------------------------------
    // ORANGE SECOND HEADER
    // ------------------------------------------------------

    const secondHeaderHeight =
        24;


    doc
        .rect(
            startX,
            y,
            tableWidth,
            secondHeaderHeight
        )
        .fill(
            `#${FUD_ORANGE}`
        );


    const labels = [

        'DAYS',
        'COURSE',
        'VENUE',
        'COURSE',
        'VENUE',
        'COURSE',
        'VENUE'

    ];


    let x =
        startX;


    labels.forEach(
        (
            label,
            index
        ) => {

            const width =
                columns[index].width;


            doc
                .font(
                    'Helvetica-Bold'
                )
                .fontSize(7)
                .fillColor(
                    `#${WHITE}`
                );


            pdfText(
                doc,
                label,
                x + 3,
                y + 7,
                width - 6,
                {
                    align: 'center'
                }
            );


            x += width;
        }
    );


    return (
        y +
        secondHeaderHeight
    );
};


// ==========================================================
// PDF ROW HEIGHT CALCULATION
// ==========================================================

const estimatePdfRowHeight = (
    values,
    columns
) => {

    let maxLines =
        1;


    values.forEach(
        (
            value,
            index
        ) => {

            const text =
                safeString(value);


            if (!text) {
                return;
            }


            const width =
                columns[index].width -
                10;


            // Approximate number of characters
            // that can fit on one line.

            const charsPerLine =
                Math.max(
                    12,
                    Math.floor(
                        width / 4.6
                    )
                );


            const lines =
                text
                    .split('\n')
                    .reduce(
                        (
                            total,
                            line
                        ) =>
                            total +
                            Math.max(
                                1,
                                Math.ceil(
                                    line.length /
                                    charsPerLine
                                )
                            ),
                        0
                    );


            maxLines =
                Math.max(
                    maxLines,
                    lines
                );
        }
    );


    return Math.min(
        82,
        Math.max(
            38,
            maxLines * 9 + 14
        )
    );
};


// ==========================================================
// PDF ROW
// ==========================================================

const drawPdfRow = (
    doc,
    startX,
    y,
    values,
    columns,
    rowHeight
) => {

    let x =
        startX;


    values.forEach(
        (
            value,
            index
        ) => {

            const width =
                columns[index].width;


            doc
                .rect(
                    x,
                    y,
                    width,
                    rowHeight
                )
                .fillAndStroke(
                    index === 0
                        ? `#${DATE_BACKGROUND}`
                        : `#${WHITE}`,
                    `#${BORDER_COLOR}`
                );


            doc
                .font(
                    index === 0
                        ? 'Helvetica-Bold'
                        : 'Helvetica'
                )
                .fontSize(
                    index === 0
                        ? 7.5
                        : 7
                )
                .fillColor(
                    `#${BLACK}`
                );


            pdfText(
                doc,
                value,
                x + 4,
                y + 6,
                width - 8,
                {
                    align:
                        index === 0
                            ? 'center'
                            : 'left',

                    lineGap: 1
                }
            );


            x += width;
        }
    );
};


// ==========================================================
// PDF FOOTER
// ==========================================================

const drawPdfPageFooter = (
    doc,
    pageNumber,
    pageCount
) => {

    const pageWidth =
        841.89;

    const pageHeight =
        595.28;


    doc
        .font(
            'Helvetica'
        )
        .fontSize(7)
        .fillColor(
            `#${FUD_GREEN}`
        );


    pdfText(
        doc,
        'Federal University Dutse Examination Timetable System',
        30,
        pageHeight - 25,
        500,
        {
            align: 'left'
        }
    );


    doc
        .fillColor(
            `#${FUD_ORANGE}`
        );


    pdfText(
        doc,
        `Page ${pageNumber} of ${pageCount}`,
        pageWidth - 160,
        pageHeight - 25,
        130,
        {
            align: 'right'
        }
    );
};


// ==========================================================
// PDF EXPORT
// ==========================================================

const generateTimetablePDF = async (
    timetableData
) => {

    if (
        !timetableData ||
        !timetableData.timetable
    ) {
        throw new Error(
            'Invalid timetable data'
        );
    }


    const timetable =
        timetableData.timetable;


    const entries =
        Array.isArray(
            timetableData.entries
        )
            ? timetableData.entries
            : [];


    const logo =
        getValidLogo();


    return new Promise(
        (
            resolve,
            reject
        ) => {

            try {

                const doc =
                    new PDFDocument({

                        size: 'A4',

                        layout:
                            'landscape',

                        margins: {
                            top: 20,
                            bottom: 35,
                            left: 28,
                            right: 28
                        },

                        bufferPages:
                            true
                    });


                const chunks = [];


                doc.on(
                    'data',
                    (chunk) => {
                        chunks.push(chunk);
                    }
                );


                doc.on(
                    'error',
                    reject
                );


                doc.on(
                    'end',
                    () => {

                        resolve(
                            Buffer.concat(
                                chunks
                            )
                        );
                    }
                );


                const pageWidth =
                    841.89;


                const pageHeight =
                    595.28;


                const startX =
                    28;


                // A4 landscape width minus
                // left/right margins.

                const tableWidth =
                    pageWidth -
                    56;


                // ==================================================
                // EXACT 7-COLUMN STRUCTURE
                // ==================================================
                //
                // DAYS
                // MORNING COURSE
                // MORNING VENUE
                // AFTERNOON COURSE
                // AFTERNOON VENUE
                // EVENING COURSE
                // EVENING VENUE
                //
                // ==================================================

                const columns = [

                    {
                        key: 'days',
                        width: 88
                    },

                    {
                        key: 'morningCourse',
                        width: 145
                    },

                    {
                        key: 'morningVenue',
                        width: 95
                    },

                    {
                        key: 'afternoonCourse',
                        width: 145
                    },

                    {
                        key: 'afternoonVenue',
                        width: 95
                    },

                    {
                        key: 'eveningCourse',
                        width: 145
                    },

                    {
                        key: 'eveningVenue',
                        width:
                            tableWidth -
                            (
                                88 +
                                145 +
                                95 +
                                145 +
                                95 +
                                145
                            )
                    }

                ];


                // Ensure the seven columns exactly
                // fill the available page width.

                const actualTableWidth =
                    columns.reduce(
                        (
                            total,
                            column
                        ) =>
                            total +
                            column.width,
                        0
                    );


                if (
                    Math.abs(
                        actualTableWidth -
                        tableWidth
                    ) > 0.1
                ) {

                    columns[
                        columns.length - 1
                    ].width +=
                        tableWidth -
                        actualTableWidth;
                }


                // ==================================================
                // HEADER
                // ==================================================

                drawPdfHeader(
                    doc,
                    timetable,
                    logo
                );


                // ==================================================
                // TABLE
                // ==================================================

                const grouped =
                    groupEntriesByDate(
                        entries
                    );


                let y =
                    193;


                y =
                    drawPdfTableHeader(
                        doc,
                        startX,
                        y,
                        columns
                    );


                // ==================================================
                // DATA ROWS
                // ==================================================

                for (
                    const group of grouped
                ) {

                    const maxEntries =
                        Math.max(
                            group.morning.length,
                            group.afternoon.length,
                            group.evening.length,
                            1
                        );


                    for (
                        let index = 0;
                        index < maxEntries;
                        index++
                    ) {

                        const morning =
                            group.morning[index];


                        const afternoon =
                            group.afternoon[index];


                        const evening =
                            group.evening[index];


                        const values = [

                            index === 0
                                ? formatLongDate(
                                    group.date
                                )
                                : '',

                            morning
                                ? getCourseShortText(
                                    morning
                                )
                                : '',

                            morning
                                ? getVenueText(
                                    morning
                                )
                                : '',

                            afternoon
                                ? getCourseShortText(
                                    afternoon
                                )
                                : '',

                            afternoon
                                ? getVenueText(
                                    afternoon
                                )
                                : '',

                            evening
                                ? getCourseShortText(
                                    evening
                                )
                                : '',

                            evening
                                ? getVenueText(
                                    evening
                                )
                                : ''

                        ];


                        const rowHeight =
                            estimatePdfRowHeight(
                                values,
                                columns
                            );


                        // Printable table/footer boundary.

                        const bottomLimit =
                            pageHeight -
                            48;


                        if (
                            y +
                            rowHeight >
                            bottomLimit
                        ) {

                            doc.addPage({

                                size: 'A4',

                                layout:
                                    'landscape',

                                margins: {
                                    top: 20,
                                    bottom: 35,
                                    left: 28,
                                    right: 28
                                }
                            });


                            // On continuation pages,
                            // repeat the university header
                            // and table header.

                            drawPdfHeader(
                                doc,
                                timetable,
                                logo
                            );


                            y =
                                193;


                            y =
                                drawPdfTableHeader(
                                    doc,
                                    startX,
                                    y,
                                    columns
                                );
                        }


                        drawPdfRow(
                            doc,
                            startX,
                            y,
                            values,
                            columns,
                            rowHeight
                        );


                        y +=
                            rowHeight;
                    }
                }


                // ==================================================
                // NOTE
                // ==================================================

                const noteHeight =
                    28;


                if (
                    y +
                    noteHeight >
                    pageHeight - 48
                ) {

                    doc.addPage({

                        size: 'A4',

                        layout:
                            'landscape',

                        margins: {
                            top: 20,
                            bottom: 35,
                            left: 28,
                            right: 28
                        }
                    });


                    drawPdfHeader(
                        doc,
                        timetable,
                        logo
                    );


                    y =
                        193;


                    y =
                        drawPdfTableHeader(
                            doc,
                            startX,
                            y,
                            columns
                        );
                }


                y += 10;


                doc
                    .font(
                        'Helvetica-Bold'
                    )
                    .fontSize(8)
                    .fillColor(
                        `#${BLACK}`
                    );


                pdfText(
                    doc,
                    `NOTE: ${getStudentNote(timetable)}`,
                    startX,
                    y,
                    tableWidth,
                    {
                        align: 'left',
                        lineGap: 2
                    }
                );


                // ==================================================
                // OPTIONAL OFFICER INFORMATION
                // ==================================================

                let footerInfoY =
                    y + 18;


                const chiefExaminer =
                    getChiefExaminer(
                        timetable
                    );


                if (
                    chiefExaminer &&
                    footerInfoY <
                        pageHeight - 48
                ) {

                    doc
                        .font(
                            'Helvetica'
                        )
                        .fontSize(7.5)
                        .fillColor(
                            `#${BLACK}`
                        );


                    pdfText(
                        doc,
                        `Chief Examiner: ${chiefExaminer}`,
                        startX,
                        footerInfoY,
                        tableWidth,
                        {
                            align: 'left'
                        }
                    );


                    footerInfoY +=
                        13;
                }


                const facultyExamOfficer =
                    getFacultyExamOfficer(
                        timetable
                    );


                if (
                    facultyExamOfficer &&
                    footerInfoY <
                        pageHeight - 48
                ) {

                    doc
                        .font(
                            'Helvetica'
                        )
                        .fontSize(7.5);


                    pdfText(
                        doc,
                        `Faculty Exam Officer: ${facultyExamOfficer}`,
                        startX,
                        footerInfoY,
                        tableWidth,
                        {
                            align: 'left'
                        }
                    );
                }


                // ==================================================
                // PAGE FOOTERS
                // ==================================================

                const range =
                    doc.bufferedPageRange();


                const pageCount =
                    range.count;


                for (
                    let page =
                        range.start;

                    page <
                    range.start +
                        range.count;

                    page++
                ) {

                    doc.switchToPage(
                        page
                    );


                    drawPdfPageFooter(
                        doc,
                        page + 1,
                        pageCount
                    );
                }


                // ==================================================
                // COMPLETE PDF
                // ==================================================

                doc.end();

            } catch (error) {

                reject(error);
            }
        }
    );
};


// ==========================================================
// EXPORTS
// ==========================================================

module.exports = {
    generateTimetableExcel,
    generateTimetablePDF
};