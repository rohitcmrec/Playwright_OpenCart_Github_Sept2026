import { APIRequestContext } from "@playwright/test"

export class ApiHelper {
    private readonly request: APIRequestContext
    private readonly baseURL: string

    constructor(request: APIRequestContext, baseURL: string) {
        this.request = request
        this.baseURL = baseURL
    }

    //GET
    async getRequest(endPoint: string, headers?: Record<string, string>) {
        let response = await this.request.get(`${this.baseURL}${endPoint}`, { headers: headers })

        return {
            status: response.status(),
            body: await response.json()
        }
    }
}