const inputTransformer = (verbOptions: any) => {
  let modifiedVerbOptions = { ...verbOptions };

  // 현재 API의 경로 확인 (undefined 방지)
  const path = verbOptions.route || '';

  // URL에 profileId 또는 accountId가 포함된 API인지 확인
  const requiresProfileId = path.includes('{profileId}');
  const requiresAccountId = path.includes('{accountId}');

  // 요청 바디(props)에서 accountId 및 profileId 제거
  if (verbOptions.props) {
    const updatedProps = verbOptions.props.filter(
      (prop: any) => !['profileId', 'profile_id', 'accountId', 'account_id'].includes(prop.name),
    );

    // 특정 API에서 profileId를 유지해야 하면 다시 추가
    if (requiresProfileId && !updatedProps.some((prop: any) => prop.name === 'profileId')) {
      updatedProps.unshift({
        name: 'profileId',
        definition: 'profileId: string',
        implementation: 'profileId: string',
        required: true,
      });
    }

    // 특정 API에서 `accountId`를 유지해야 하면 다시 추가
    if (requiresAccountId && !updatedProps.some((prop: any) => prop.name === 'accountId')) {
      updatedProps.unshift({
        name: 'accountId',
        definition: 'accountId: string',
        implementation: 'accountId: string',
        required: true,
      });
    }

    // 수정된 props 반영
    modifiedVerbOptions = { ...modifiedVerbOptions, props: updatedProps };
  }

  // 요청의 params(쿼리스트링 또는 경로 매개변수)에서 profileId 및 accountId 제거
  if (verbOptions.params) {
    const updatedParams = verbOptions.params.filter(
      (param: any) => !['profileId', 'profile_id', 'accountId', 'account_id'].includes(param.name),
    );

    // 수정된 params 반영
    modifiedVerbOptions = { ...modifiedVerbOptions, params: updatedParams };
  }

  return modifiedVerbOptions;
};

const outputTransformer = (api: any) => {
  // Request에서는 accountId 및 profileId를 제거하지만, Response에서는 유지
  if (api.components && api.components.schemas) {
    Object.entries(api.components.schemas).forEach(([schemaKey, schemaValue]) => {
      if (schemaValue && typeof schemaValue === 'object' && 'properties' in schemaValue) {
        const schema = schemaValue as {
          type?: string;
          properties?: Record<string, any>;
          required?: string[];
        };

        // Request 스키마에서만 profileId, accountId 제거
        if (schemaKey.toLowerCase().includes('request')) {
          if (schema.properties) {
            delete schema.properties.profileId;
            delete schema.properties.accountId;
          }

          if (Array.isArray(schema.required)) {
            schema.required = schema.required.filter((prop) => prop !== 'profileId' && prop !== 'accountId');
            if (schema.required.length === 0) {
              delete schema.required;
            }
          }
        }
      }
    });
  }

  // API paths 내 parameters에서 profileId, accountId 제거 (단, 경로에 포함된 경우는 유지)
  if (api.paths && typeof api.paths === 'object') {
    Object.entries(api.paths).forEach(([pathKey, pathItem]) => {
      if (typeof pathItem === 'object' && pathItem !== null) {
        Object.entries(pathItem).forEach(([method, operation]) => {
          if (typeof operation === 'object' && operation !== null && 'parameters' in operation) {
            const operationData = operation as { parameters?: any[] };

            // 경로 변수 확인 (profileId, accountId가 경로에 포함된 경우 삭제하지 않음)
            const hasProfileIdInPath = pathKey.includes('{profileId}');
            const hasAccountIdInPath = pathKey.includes('{accountId}');

            if (Array.isArray(operationData.parameters)) {
              operationData.parameters = operationData.parameters.filter(
                (param) =>
                  !(
                    (!hasProfileIdInPath && param.name === 'profileId') ||
                    (!hasAccountIdInPath && param.name === 'accountId')
                  ),
              );

              // `parameters`가 비어 있으면 삭제
              if (operationData.parameters.length === 0) {
                delete operationData.parameters;
              }
            }
          }
        });
      }
    });
  }
  return api;
};

module.exports = {
  coreStore: {
    output: {
      target: './src/service/core/coreStore.ts', // React Query 훅이 생성될 파일
      schemas: './src/service/core/schemas', // TypeScript 타입 정의를 저장할 경로
      client: 'react-query', // React Query 기반 훅 생성
      prettier: true, // 린트 적용
      override: {
        mutator: {
          path: './src/service/custom-fetcher.ts',
          name: 'customFetcher',
        },
        query: {
          useQuery: true,
          // usePrefetch: true,
          // useInfinite: true,
          options: {
            staleTime: 60 * 1000,
          },
        },
        transformer: inputTransformer,
      },
    },
    input: {
      target: './src/swagger/core/swagger.json', // OpenAPI 문서
      override: {
        transformer: outputTransformer,
      },
    },
  },
  fileStore: {
    output: {
      target: './src/service/file/fileStore.ts', // React Query 훅이 생성될 파일
      schemas: './src/service/file/schemas', // TypeScript 타입 정의를 저장할 경로
      client: 'react-query', // React Query 기반 훅 생성
      prettier: true, // 린트 적용
      override: {
        mutator: {
          path: './src/service/custom-fetcher.ts',
          name: 'customFetcher',
        },
        query: {
          useQuery: true,
          // usePrefetch: true,
          // useInfinite: true,
          // useInfiniteQueryParam: 'offsetWithLimit',
          options: {
            staleTime: 60 * 1000,
          },
        },
        transformer: inputTransformer,
      },
    },
    input: {
      target: './src/swagger/file/swagger.json', // OpenAPI 문서
      override: {
        transformer: outputTransformer,
      },
    },
  },
  memberStore: {
    output: {
      target: './src/service/member/memberStore.ts', // React Query 훅이 생성될 파일
      schemas: './src/service/member/schemas', // TypeScript 타입 정의를 저장할 경로
      client: 'react-query', // React Query 기반 훅 생성
      prettier: true, // 린트 적용
      override: {
        mutator: {
          path: './src/service/custom-fetcher.ts',
          name: 'customFetcher',
        },
        query: {
          useQuery: true,
          // usePrefetch: true,
          // useInfinite: true,
          options: {
            staleTime: 60 * 1000,
          },
        },
        transformer: inputTransformer,
      },
    },
    input: {
      target: './src/swagger/member/swagger.json', // OpenAPI 문서
      override: {
        transformer: outputTransformer,
      },
    },
  },
  messageStore: {
    output: {
      target: './src/service/message/messageStore.ts', // React Query 훅이 생성될 파일
      schemas: './src/service/message/schemas', // TypeScript 타입 정의를 저장할 경로
      client: 'react-query', // React Query 기반 훅 생성
      prettier: true, // 린트 적용
      override: {
        mutator: {
          path: './src/service/custom-fetcher.ts',
          name: 'customFetcher',
        },
        query: {
          useQuery: true,
          // usePrefetch: true,
          // useInfinite: true,
          options: {
            staleTime: 60 * 1000,
          },
        },
        transformer: inputTransformer,
      },
    },
    input: {
      target: './src/swagger/message/swagger.json', // OpenAPI 문서
      override: {
        transformer: outputTransformer,
      },
    },
  },
  aiAndProxyStore: {
    output: {
      target: './src/service/aiAndProxy/aiAndProxyStore.ts', // React Query 훅이 생성될 파일
      schemas: './src/service/aiAndProxy/schemas', // TypeScript 타입 정의를 저장할 경로
      client: 'react-query', // React Query 기반 훅 생성
      prettier: true, // 린트 적용
      override: {
        mutator: {
          path: './src/service/custom-fetcher.ts',
          name: 'customFetcher',
        },
        query: {
          useQuery: true,
          options: {
            staleTime: 60 * 1000,
          },
        },
        transformer: outputTransformer,
      },
    },
    input: {
      target: './src/swagger/aiAndProxy/swagger.json', // OpenAPI 문서
      override: {
        transformer: outputTransformer,
      },
    },
  },
};
