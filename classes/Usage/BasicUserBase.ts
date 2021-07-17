import { Form } from "../../../../API/RenderBits/FormFactory";
import { Route } from "../../../../API/Routing/Routing";
import { RegistrationForm } from "../../forms/registrationForm";
import { DataStore, DataStoreParameter, DataStoreTableVariable } from "../DataStore";
import { UserBase, UserBaseController, UserBaseManager } from "../UserBase";
import crypto from "crypto";
import { Response } from "express";

export class BasicUser extends UserBase
{
    constructor()
    {
        super();
    }

    public async LoginById(_id: number): Promise<boolean>
    {
        const rows = await DataStore.FetchFromTable("users", ["*"], [`id=\"${_id}\"`], [], "LIMIT 1")
        if (rows.length == 0)
            return false;

        const userData = rows[0];

        this.SetId(userData.id);
        this.SetUsername(userData.username);
        this.SetPassword(userData.password);

        return true;
    }
    public async Login(_accessIdentifier: string, _password: string): Promise<boolean>
    {
        _password = this.Encrypt(_password);
        const accessIdentifier: string = '' + _accessIdentifier;
        const password: string = '' + _password;

        const rows = await DataStore.FetchFromTable("users", ["*"], [`username=\"${accessIdentifier}\"`, `password=\"${password}\"`], [], "LIMIT 1")
        if (rows.length == 0)
            return false;

        const userData = rows[0];

        this.SetId(userData.id);
        this.SetUsername(userData.username);
        this.SetPassword(userData.password);

        return true;
    }
    public Encrypt(_password: string): string
    {
        return crypto.createHash('sha256').update(_password).digest('base64');
    }
    public GenerateRegisterForm(_route: Route, _response: Response): Form|undefined
    {
        return Form.CreateForm(new RegistrationForm(_route), _response);
    }
    public async Commit(): Promise<boolean>
    {
        var success = false;
        if (this.GetId() == -1)
        {
            success = await DataStore.InsertToTable("users",
                new DataStoreParameter("username", this.GetUsername()),
                new DataStoreParameter("password", this.GetPassword()),
                new DataStoreParameter("email", this.GetEmail()),
            );

            this.SetId(await DataStore.GetLastInsertID("users"));
        }
        else
        {
            success = await DataStore.UpdateTable("users", [`\`ID\`=${this.GetId()}`], new DataStoreParameter("username", this.GetUsername()), new DataStoreParameter("password", this.GetPassword()), new DataStoreParameter("email", this.GetEmail()))
        }

        return success;
    }
    public async Destroy(): Promise<boolean>
    {
        const beforeID = this.GetId();
        if (beforeID == -1)
            return false;
        this.SetId(-1); // We destroyed it.
        return await DataStore.RemoveRowFromTable("users", [`\`ID\`=${beforeID}`]);
    }
}

export class BasicUserController extends UserBaseController
{
    constructor()
    {
        super(BasicUser);
    }
    private async TestBench()
    {
        console.log("Basic User Controller TestBench!");
        const testUser = UserBaseManager.NewUser() as BasicUser;
        testUser.SetUsername("Test User");
        testUser.SetPassword("Test");
        testUser.SetEmail("test@email.com");
        await testUser.Commit();
        await testUser.Destroy();
        testUser.SetUsername("test");
        testUser.SetPassword("test");
        await testUser.Commit();


        // const users = await DataStore.FetchFromTable("users", ['*']);
        // console.log(users);
    }

    public async Initialize() : Promise<void>
    {
        await DataStore.DeleteTable("users");
        await DataStore.CreateTable("users",
            new DataStoreTableVariable("id", "INTEGER", { PRIMARY_KEY: true, AUTO_INCREMENT: true, NOT_NULL: true }),
            new DataStoreTableVariable("username", "VARCHAR(35)", { NOT_NULL: true }),
            new DataStoreTableVariable("password", "VARCHAR(512)", { NOT_NULL: true }),
            new DataStoreTableVariable("email", "VARCHAR(64)", { NOT_NULL: true }),
            new DataStoreTableVariable("creationDate", "TIMESTAMP", { DEFAULT: "CURRENT_TIMESTAMP", NOT_NULL: true })
        );

        this.TestBench();
    }
}