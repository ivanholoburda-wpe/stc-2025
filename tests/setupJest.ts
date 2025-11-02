jest.mock('xlsx', () => ({
    utils: {
        book_new: jest.fn(() => ({ Sheets: {}, SheetNames: [] })),
        json_to_sheet: jest.fn((data) => ({ '!data': data })),
        book_append_sheet: jest.fn(),
    },
}));