import fs from 'fs'
import { parse } from 'csv-parse/sync'
import path from 'path'
import xlsx from 'xlsx'

export class DataProvider {

    getDataFromJson(filePath: string) {
        let absolutePath = path.resolve(__dirname, filePath);
        return JSON.parse(fs.readFileSync(absolutePath, 'utf8'))
    }

    getDataFromCSV(filePath: string) {
        let absolutePath = path.resolve(__dirname, filePath);
        return parse(fs.readFileSync(absolutePath), { columns: true, skip_empty_lines: true })
    }

    getDataFromXlsx(filePath: string, index: number) {
        let absolutePath = path.resolve(__dirname, filePath);
        const workbook = xlsx.readFile(absolutePath);
        let sheetName = workbook.SheetNames[index]
        let sheet = workbook.Sheets[sheetName];

        return xlsx.utils.sheet_to_json(sheet);
    }
}