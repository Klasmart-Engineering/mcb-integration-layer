import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  NormalizedCacheObject,
  from,
} from '@apollo/client/core';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry';
import { Prisma } from '@prisma/client';
import fetch from 'cross-fetch';
import logger from '../utils/logging';
import { getPrograms } from '../api/adminService/programs';
import { getRoles } from '../api/adminService/roles';
import { addSchool } from '../api/adminService/schools';
import { getOrganizations } from '../api/adminService/organizations';
import { CreateSchoolInput } from '../utils/types';

export class AdminService {
  public static async getInstance() {
    const httpLink = new HttpLink({
      uri: process.env.ADMIN_SERVICE_URL,
      fetch,
    });
    /**
     * Only retry network errors
     *
     * Reference: https://www.apollographql.com/docs/react/api/link/apollo-link-retry/
     */
    const retryLink = new RetryLink({
      delay: {
        initial: 300,
        max: Infinity,
        jitter: true,
      },
      attempts: {
        max: 5,
        retryIf: (error, _operation) => !!error,
      },
    });
    const errorLink = onError(({ graphQLErrors, networkError }) => {
      /**
       * GraphQL errors, will not retry
       *
       * - Syntax errors (e.g., a query was malformed) - 4xx error
       * - Validation errors (e.g., a query included a schema field that doesn't exist) - 4xx error
       * - Resolver errors (e.g., an error occurred while attempting to populate a query field) - 2xx error
       *
       * Reference: https://www.apollographql.com/docs/react/data/error-handling
       */
      if (graphQLErrors)
        graphQLErrors.forEach(({ message, locations, path }) =>
          logger.error(`[GraphQL error]: ${message}`)
        );

      // 4xx/5xx errors
      if (networkError) logger.error(`[Network error]: ${networkError}`);
    });

    try {
      if (this._instance) {
        return this._instance;
      } else {
        const client = new ApolloClient({
          link: from([errorLink, retryLink, httpLink]),
          cache: new InMemoryCache(),
        });
        this._instance = new AdminService(client);
        logger.info('Connected to KidsLoop admin service');
        return this._instance;
      }
    } catch (e) {
      logger.error('❌ Failed to connect KidsLoop admin service');
      throw e;
    }
  }

  private static _instance: AdminService;
  private _client: ApolloClient<NormalizedCacheObject>;
  private _networkErrMessage =
    'pull {0} data from admin service failed with network error: {1}';
  private _errMessage = 'pull {0} data from admin service failed with error: ';

  private constructor(client: ApolloClient<NormalizedCacheObject>) {
    this._client = client;
  }

  get client(): ApolloClient<NormalizedCacheObject> {
    return this._client;
  }

  // While loop to get all programs from Admin User service
  async getPrograms(): Promise<Prisma.ProgramCreateInput[]> {
    try {
      let hasNextPage = true;
      let cursor = '';
      const programs: Prisma.ProgramCreateInput[] = [];
      while (hasNextPage) {
        /**
         * Don't need to handle errors here because:
         *
         * - 4xx/5xx were handel in `errorLink` while init `ApolloClient`
         * - 2xx errors won't exist in this case
         */
        const { data } = await getPrograms(
          process.env.ADMIN_SERVICE_JWT || '',
          cursor
        );

        const responseData = data.programsConnection;
        hasNextPage = responseData.pageInfo.hasNextPage;
        cursor = responseData.pageInfo.endCursor;

        for (const programNode of responseData.edges) {
          programs.push({
            name: programNode.node.name,
            client: 'MCB',
            klUuid: programNode.node.id,
            klOrgUuid: '001be878-11c2-40dc-ad25-bfbcbf6f0960', // TODO: replace with real org UUID
          });
        }
      }

      return programs;
    } catch (e) {
      // Will not log error here because already did in `errorLink` while init `ApolloClient`
      // console.log(JSON.stringify(e, null, 2));
      return [];
    }
  }

  // While loop to get all roles from Admin User service
  async getRoles(): Promise<Prisma.RoleCreateInput[]> {
    try {
      let hasNextPage = true;
      let cursor = '';
      const roles: Prisma.RoleCreateInput[] = [];
      while (hasNextPage) {
        /**
         * Don't need to handle errors here because:
         *
         * - 4xx/5xx were handel in `errorLink` while init `ApolloClient`
         * - 2xx errors won't exist in this case
         */
        const { data } = await getRoles(
          process.env.ADMIN_SERVICE_JWT || '',
          cursor
        );

        const responseData = data.rolesConnection;
        hasNextPage = responseData.pageInfo.hasNextPage;
        cursor = responseData.pageInfo.endCursor;

        for (const roleNode of responseData.edges) {
          roles.push({
            name: roleNode.node.name,
            client: 'MCB',
            klUuid: roleNode.node.id,
            klOrgUuid: '001be878-11c2-40dc-ad25-bfbcbf6f0960', // TODO: replace with real org UUID
            system: roleNode.node.system,
          });
        }
      }

      return roles;
    } catch (e) {
      // Will not log error here because already did in `errorLink` while init `ApolloClient`
      // console.log(JSON.stringify(e, null, 2));
      return [];
    }
  }

  /**
   * Adds schools to user service.
   * @param schools
   * @param klOrgUuid 
   */
  async addSchools(schools: CreateSchoolInput[]) {
    try {
      await addSchool(
        process.env.ADMIN_SERVICE_JWT || '',
        schools
      );
    } catch (err) {
      logger.error(err);
      throw new Error('Error adding school in school service');
    }
  }
  
  // While loop to get all organizations from Admin User service
  async getOrganizations(
    name: string
  ): Promise<Prisma.OrganizationCreateInput[]> {
    try {
      let hasNextPage = true;
      let cursor = '';
      const organizations: Prisma.OrganizationCreateInput[] = [];
      while (hasNextPage) {
        /**
         * Don't need to handle errors here because:
         *
         * - 4xx/5xx were handel in `errorLink` while init `ApolloClient`
         * - 2xx errors won't exist in this case
         */
        const { data } = await getOrganizations(
          process.env.ADMIN_SERVICE_JWT || '',
          name,
          cursor
        );

        const responseData = data.organizationsConnection;
        hasNextPage = responseData.pageInfo.hasNextPage;
        cursor = responseData.pageInfo.endCursor;

        for (const organizationNode of responseData.edges) {
          organizations.push({
            name: organizationNode.node.name,
            klUuid: organizationNode.node.id,
            clientUuid: '', // will update later
          });
        }
      }

      return organizations;
    } catch (e) {
      // Will not log error here because already did in `errorLink` while init `ApolloClient`
      // console.log(JSON.stringify(e, null, 2));
      return [];
    }
  }
}
